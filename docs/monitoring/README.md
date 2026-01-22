# 📊 Monitoring & Observability

Complete monitoring setup and observability stack documentation.

---

## 🏗️ Stack Overview

The Agri Platform includes a comprehensive observability stack:

| Component                   | Port | Purpose                      |
| --------------------------- | ---- | ---------------------------- |
| **Prometheus**              | 9090 | Metrics collection & storage |
| **Grafana**                 | 3000 | Dashboards & visualization   |
| **Loki**                    | 3100 | Log aggregation              |
| **Tempo**                   | 3200 | Distributed tracing          |
| **OpenTelemetry Collector** | 4317 | Telemetry collection         |

---

## 📈 Prometheus

### Configuration

Located in `infrastructure/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "api-gateway"
    static_configs:
      - targets: ["api-gateway:8000"]

  - job_name: "order-service"
    static_configs:
      - targets: ["order-service:8002"]
```

### Accessing Prometheus

1. Navigate to http://localhost:9090
2. Use **Expression Browser** to query metrics
3. Scrape targets: http://localhost:9090/targets

### Common Queries

```promql
# Request count per service
sum by (service) (rate(http_requests_total[5m]))

# Error rate (percentage)
sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
/
sum by (service) (rate(http_requests_total[5m])) * 100

# Request latency (p99)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage (MB)
process_resident_memory_bytes / 1024 / 1024

# CPU usage (%)
rate(process_cpu_seconds_total[1m]) * 100

# Database connection pool
pgbouncer_pools_client_connections{pool="orders_db"}
```

### Alert Rules

Create `prometheus-rules.yml` for alerting:

```yaml
groups:
  - name: services
    rules:
      - alert: HighErrorRate
        expr: |
          (sum by (service) (rate(http_requests_total{status=~"5.."}[5m])) 
          / 
          sum by (service) (rate(http_requests_total[5m]))) > 0.05
        for: 5m
        annotations:
          summary: "High error rate for {{ $labels.service }}"

      - alert: SlowRequests
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        annotations:
          summary: "Slow requests detected"
```

---

## 🎨 Grafana

### Initial Setup

1. Access http://localhost:3000
2. Default credentials: **admin** / **admin**
3. Change password on first login

### Default Dashboards

**API Gateway Dashboard**

- Request rate (RPS)
- Error rate
- Response times (p50, p95, p99)
- Active connections

**Service Health Dashboard**

- Service status (up/down)
- Health check success rate
- Pod restart count
- Memory & CPU usage

**Database Dashboard**

- Query performance
- Connection pool status
- Slow query log
- Transaction rate

### Creating Custom Dashboards

1. Click "+" → "Dashboard" → "Create Dashboard"
2. Add panels by clicking "Add Panel"
3. Select data source: **Prometheus**
4. Write PromQL query:

```promql
rate(http_requests_total{job="api-gateway"}[5m])
```

5. Customize title, description, visualization
6. Save dashboard

### Example Dashboard JSON

```json
{
  "dashboard": {
    "title": "API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))"
          }
        ]
      }
    ]
  }
}
```

---

## 📝 Loki

### Configuration

Located in `infrastructure/loki.yml`

```yaml
auth_enabled: false

ingester:
  chunk_idle_period: 3m
  max_chunk_age: 1h

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
```

### Accessing Loki

1. Navigate to http://localhost:3100
2. Add as data source in Grafana
3. Query logs using LogQL

### Log Format

Each log entry contains:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "service": "order-service",
  "level": "INFO",
  "message": "Order created",
  "orderId": "ord-123",
  "customerId": "cust-001",
  "duration": 145
}
```

### LogQL Queries

```
# All logs from order-service
{job="order-service"}

# Error logs only
{job="order-service"} | json | level="ERROR"

# Search for specific order
{job="order-service"} | json | orderId="ord-123"

# Count errors per minute
rate({job="order-service"} | json | level="ERROR" [1m])

# Find slow requests
{job="api-gateway"} | json | duration > 1000
```

### Setting Up Log Aggregation

Add labels in docker-compose.yml:

```yaml
services:
  order-service:
    logging:
      driver: loki
      options:
        loki-url: http://loki:3100/loki/api/v1/push
        labels: service=order-service,environment=dev
```

---

## 🔍 Tempo (Distributed Tracing)

### Configuration

Located in `infrastructure/tempo.yml`

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317
```

### Trace Propagation

Traces flow through services via headers:

```
traceparent: 00-<trace-id>-<span-id>-<flags>
baggage: correlation-id=req-123
```

### Viewing Traces

1. Add Tempo as data source in Grafana
2. Explore → Select Tempo data source
3. Query by trace ID or service name
4. View trace waterfall diagram

### Instrumentation Example

```javascript
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-node");

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: "http://otel-collector:4317",
  }),
});

sdk.start();
```

---

## 📊 OpenTelemetry

### Components

1. **Instrumentation**: Collect telemetry
2. **Exporter**: Send to backend (Prometheus, Loki, Tempo)
3. **Collector**: Receive, process, export telemetry

### Collector Configuration

Located in `infrastructure/otel-collector-config.yml`

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    send_batch_size: 100
    timeout: 10s

exporters:
  prometheus:
    endpoint: "0.0.0.0:8888"

  loki:
    endpoint: http://loki:3100/loki/api/v1/push

exporters:
  jaeger:
    endpoint: tempo:14250

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]
```

---

## 🔔 Alerting Setup

### Grafana Alerts

1. Open dashboard panel
2. Click "Alert" tab
3. Set threshold (e.g., error_rate > 5%)
4. Configure notification channel
5. Add to alert group

### Notification Channels

Configure in Grafana:

**Email**

- SMTP server configuration
- Recipient list

**Slack**

- Webhook URL
- Channel selection

**PagerDuty**

- Integration key
- Severity mapping

### Alert Message Example

```
Service: api-gateway
Alert: HighErrorRate
Threshold: >5%
Current: 7.2%
Duration: 5 minutes

Graph: [Dashboard URL]
```

---

## 🚀 Best Practices

### Metrics Collection

1. **Use meaningful names**: `http_requests_total`, not `requests`
2. **Add labels**: `service`, `method`, `status`, `endpoint`
3. **Track latency**: Use histogram buckets (0.1s, 0.5s, 1s, 2s, 5s)
4. **Monitor saturation**: CPU, memory, disk, connections

### Log Aggregation

1. **Structured logs**: Use JSON format
2. **Include context**: Request ID, user ID, service
3. **Appropriate levels**: DEBUG, INFO, WARN, ERROR
4. **Retention**: 30 days for logs, 15 days for traces

### Dashboard Design

1. **Golden signals**: Latency, traffic, errors, saturation
2. **Drill-down**: Link to related dashboards
3. **Refresh rate**: 30s for operational, 5m for historical
4. **Red flags**: Use thresholds to highlight problems

---

## 🔧 Troubleshooting

### Prometheus Not Scraping

```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Check scrape config
docker-compose logs prometheus
```

### Grafana Not Showing Data

```bash
# Verify Prometheus is running
curl http://localhost:9090/api/v1/query?query=up

# Check data source configuration
# Settings → Data Sources → Prometheus
```

### No Logs in Loki

```bash
# Check Loki is running
curl http://localhost:3100/loki/api/v1/labels

# Verify log driver in docker-compose
# Check Promtail configuration
```

---

## 📚 Related Documentation

- [Getting Started](../getting-started/)
- [Deployment](../deployment/)
- [Testing](../testing/)
- [Guides](../guides/)
