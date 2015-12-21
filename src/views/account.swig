{% extends 'base.swig' %}

{% set title = 'Welcome' %}

{% block content %}
	<p><strong>Email:</strong> {{ user.email }}</p>
{% endblock %}