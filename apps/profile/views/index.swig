{% extends '../../../src/views/base.swig' %}

{% set title = 'Profile' %}
{% set heading = 'Profile' %}

{% block content %}
	<p><strong>Email:</strong> {{ user.email }}</p>
{% endblock %}