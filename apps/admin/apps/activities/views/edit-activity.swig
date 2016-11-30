{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Edit Activity' %}
{% set heading = 'Edit "' + activity.name + '" Activity' %}
{% set activeApp = 'admin' %}

{% block content %}
	{% set action = 'Update' %}
	{% include 'partials/activity-form.swig' %}
{% endblock %}
