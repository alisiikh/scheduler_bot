
{{ idx }}.

id: {{ jobId }},

name: {{ jobName }},

lastRunAt: {{ lastRunAt | date('H:i d-m-Y') | default('no') }},

nextRunAt: {{ nextRunAt | date('H:i d-m-Y') | default('no') }},

content: {{ content | excerpt(15) }}
