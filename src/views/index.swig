{% extends 'base.swig' %}

{% block content %}
	<h1>Home</h1>
	{% include 'partials/flash.swig' %}
	<a href="/login">Login</a>
{% endblock %}