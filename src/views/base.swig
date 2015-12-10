<!DOCTYPE html>
<html lang="en">
	<head>
		<title>{% block title %}{{ config.title }} &mdash; {{ config.organisation }}{% endblock %}</title>
		<link rel="shortcut icon" href="/static/img/favicon.ico" />
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
		{% block content %}{% endblock %}
	</body>
</html>