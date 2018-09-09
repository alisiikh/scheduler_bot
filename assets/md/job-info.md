index: **{{ idx }}**,  \
name: {{ jobName }},  \
lastRunAt: {{ lastRunAt | date('HH:mm DD-MM-Y') }},  \
nextRunAt: {{ nextRunAt | date('HH:mm DD-MM-Y') }},  \
content: {{ content | excerpt(30) }}