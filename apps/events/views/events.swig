{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<ul class="list-group">
		{% for event in events %}
			<li class="list-group-item">{% include 'partials/event.swig' %}</li>
		{% endfor %}
	</ul>
{% endblock %}
