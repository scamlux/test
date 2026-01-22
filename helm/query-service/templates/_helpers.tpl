{{- define "query-service.fullname" -}}{{.Release.Name}}-{{.Chart.Name}}{{- end }}
{{- define "query-service.labels" -}}app: {{ include "query-service.fullname" . }}{{- end }}
{{- define "query-service.selectorLabels" -}}app: {{ include "query-service.fullname" . }}{{- end }}
