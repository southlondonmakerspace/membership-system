{% extends 'base.swig' %}

{% block content %}
	<h1>Welcome</h1>
	{% include 'partials/flash.swig' %}
	<p>{{ user.email }}</p>
	<p><a href="/logout">Logout</a></p>
{% endblock %}