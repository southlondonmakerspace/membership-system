{% extends '../../../src/views/base.swig' %}

{% set title = 'Create Permission' %}
{% set heading = 'Create Permission' %}
{% set activeApp = 'admin' %}

{% block content %}
	{% set action = 'Create' %}
	{% include 'partials/permission-form.swig' %}
{% endblock %}