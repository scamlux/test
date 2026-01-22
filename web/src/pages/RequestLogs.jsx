import React, { useEffect, useCallback, useState } from "react";
import { logsAPI } from "../api/client";
import "./RequestLogs.css";

export default function RequestLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (filter === "all") {
        response = await logsAPI.getAll(200);
      } else {
        response = await logsAPI.getByService(filter, 100);
      }
      setLogs(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
  }, [filter, fetchLogs]);

  return (
    <div className="request-logs">
      <div className="logs-header">
        <h2>Request Logs</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Services</option>
          <option value="product-service">Product Service</option>
          <option value="order-service">Order Service</option>
          <option value="delivery-service">Delivery Service</option>
          <option value="query-service">Query Service</option>
        </select>
      </div>

      {loading && <div className="loading">Loading logs...</div>}

      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>Duration (ms)</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className={`status-${log.status_code}`}>
                <td>{log.service_name}</td>
                <td>
                  <span className={`method ${log.method}`}>{log.method}</span>
                </td>
                <td className="endpoint">{log.endpoint}</td>
                <td>{log.status_code || "-"}</td>
                <td>{log.duration_ms}ms</td>
                <td className="time">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && !loading && (
        <div className="empty">No requests logged yet</div>
      )}
    </div>
  );
}
