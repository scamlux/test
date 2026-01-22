{{- define "web.fullname" -}}{{.Release.Name}}-{{.Chart.Name}}{{- end }}
{{- define "web.labels" -}}app: {{ include "web.fullname" . }}{{- end }}
{{- define "web.selectorLabels" -}}app: {{ include "web.fullname" . }}{{- end }}
