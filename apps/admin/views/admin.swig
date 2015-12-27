{% extends '../../../src/views/base.swig' %}

{% set title = 'Admin' %}
{% set heading = 'Admin' %}
{% set activeApp = 'admin' %}

{% block content %}
	<ul>
		<li><a href="/admin/members">Members</a></li>
		<li><a href="/admin/permissions">Permissions</a></li>
		<li><a href="/admin/settings">Settings</a></li>
	</ul>
{% endblock %}