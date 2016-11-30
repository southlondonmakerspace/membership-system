{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Create Activity' %}
{% set heading = title %}
{% set activeApp = 'admin' %}

{% block content %}
	{% set action = 'Create' %}
	{% include 'partials/activity-form.swig' %}
{% endblock %}
