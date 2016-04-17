{% extends '../../../src/views/base.swig' %}

{% set title = 'Update Member Permission' %}
{% set heading = 'Update Permission' %}
{% set activeApp = 'admin' %}

{% block content %}
	{% set action = 'Update' %}
	{% include 'partials/member-permission-form.swig' %}
{% endblock %}