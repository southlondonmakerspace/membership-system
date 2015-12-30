{% extends '../../../src/views/base.swig' %}

{% set title = 'Edit Permission' %}
{% set heading = 'Edit "' + permission.name + '" Permission' %}
{% set activeApp = 'admin' %}

{% block content %}
	{% set action = 'Update' %}
	{% include 'partials/permission-form.swig' %}
{% endblock %}