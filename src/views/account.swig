{% extends 'base.swig' %}

{% set title = 'Account' %}
{% set heading = 'Welcome' %}

{% block content %}
	<p><strong>Email:</strong> {{ user.email }}</p>
{% endblock %}