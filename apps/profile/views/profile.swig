{% extends '../../../src/views/base.swig' %}

{% set title = 'Profile' %}
{% set heading = 'Profile' %}

{% block content %}
	<p><strong>Name:</strong> {{ user.fullname }}</p>
	
	<p><strong>Email:</strong> {{ user.email }}</p>

	<p><strong>Tag:</strong> {{ user.tag_id }}</p>

	<p><strong>Address:</strong> {{ user.address }}</p>

	<p>
		<a href="/profile/update" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a>
	</p>
{% endblock %}