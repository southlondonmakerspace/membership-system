{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Update Member Permission' %}
{% set heading = 'Update "' + current.permission.name + '" Permission' %}
{% set activeApp = 'admin' %}

{% block content %}
	{% set action = 'Update' %}
	{% set partial = true %}
	{% include 'partials/member-permission-form.swig' %}
{% endblock %}
