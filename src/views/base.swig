<!DOCTYPE html>
<html lang="en">
	<head>
		<title>{% block title %}{{ config.title }} &mdash; {{ config.organisation }}{% endblock %}</title>
		<link rel="shortcut icon" href="/imgs/favicon.ico" />
		{% block stylesheets %}
			<link rel="stylesheet" type="text/css" href="/css/bootstrap.min.css">
			<link rel="stylesheet" type="text/css" href="/css/style.css">
		{% endblock %}
		{% block scripts %}
			<script src="/js/jquery.js"></script>
			<script src="/js/bootstrap.js"></script>
			<script src="/js/script.js"></script>
		{% endblock %}
	</head>
	<body>
		<div class="container">
			{% include 'partials/navbar.swig' %}
	    	{% include 'partials/flash.swig' %}
	    	{% if title %}
	    		<div class="page-header">
					<h1>{{ title }}</h1>
				</div>
			{% endif %}
			{% block content %}{% endblock %}
		</div>
	</body>
</html>