{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = 'Hello ' + user.firstname + '...' %}

{% block content %}
	<div class="row">
		<div class="col-md-2">
			<img style="border-radius: 100%" src="{{ user.gravatar }}?s=150&d=mm&r=g">
		</div>
		<div class="col-md-1">
			<p class="pull-right"><strong>Name:</strong></p>
			<p class="pull-right"><strong>Email:</strong></p>
			<p class="pull-right"><strong>Address:</strong></p>
		</div>
		<div class="col-md-9">
			<p>{{ user.fullname }}</p>
			<p>{{ user.email }}</p>
			<p>{{ user.address | replace('\r\n', ', ', 'gim') }}</p>
		</div>
		<div class="col-md-10">
			<div class="page-header">
				<h3>Account</h3>
			</div>
			<p>
				<a href="/profile/update" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit Profile</a>
				<a href="/profile/change-password" class="btn btn-default"><span class="glyphicon glyphicon-lock"></span> Change Password</a>
				<a href="/profile/emergency-contact" class="btn btn-default"><span class="glyphicon glyphicon-exclamation-sign"></span> Emergency Contact</a>
				<a href="/profile/direct-debit" class="btn btn-default"><span class="glyphicon glyphicon-piggy-bank"></span> Direct Debit</a>
				<a href="/profile/discourse" class="btn btn-default"><span class="glyphicon glyphicon-book"></span> Link Discourse</a>
				<a href="/profile/tag" class="btn btn-default"><span class="glyphicon glyphicon-credit-card"></span> Tag</a>
			</p>
		</div>
	</div>
{% endblock %}
