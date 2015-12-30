{% extends '../../../src/views/base.swig' %}

{% set title = 'Update Member' %}
{% set heading = 'Update "' + member.fullname + '"' %}
{% set activeApp = 'admin' %}

{% block content %}
	{% set action = 'Update' %}
	{% include 'partials/member-form.swig' %}
{% endblock %}