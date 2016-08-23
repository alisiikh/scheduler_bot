index: **{{ idx }}**, 
name: {{ jobName }}, 
lastRunAt: {{ lastRunAt | date('HH:mm DD-MM-Y') | default('no') }}, 
nextRunAt: {{ nextRunAt | date('HH:mm DD-MM-Y') | default('no') }}, 
content: {{ content | excerpt(30) }}