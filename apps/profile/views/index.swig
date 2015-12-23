{% extends '../../../src/views/base.swig' %}

{% set title = 'Profile' %}
{% set heading = 'Profile' %}

{% block content %}
	<p><strong>Name:</strong> {{ user.fullname }}</p>
	<p><strong>Email:</strong> {{ user.email }}</p>
{% endblock %}