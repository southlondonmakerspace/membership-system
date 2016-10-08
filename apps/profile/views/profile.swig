{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<div class="row">
		<div class="col-md-2">
			<img style="border-radius: 100%" src="{{ user.gravatar }}?s=150&d=mm&r=g">
		</div>
		<div class="col-md-2">
			<p><strong>Name:</strong></p>
			<p><strong>Email:</strong></p>
			<p><strong>Address:</strong></p>
		</div>
		<div class="col-md-8">
			<p>{{ user.fullname }}</p>
			<p>{{ user.email }}</p>
			<p>{{ user.address | replace('\r\n', ', ', 'gim') }}</p>
			<p><a href="/profile/update" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a></p>
			<p><a href="/profile/change-password" class="btn btn-default"><span class="glyphicon glyphicon-lock"></span> Change Password</a></p>
		</div>
	</div>
{% endblock %}
