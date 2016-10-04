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

	<div class="page-header">
		<h3>Setup</h3>
	</div>

	<p>New round here? Follow these steps to setup your account...</p>

	<ol style="padding-left: 2em;">
		<li style="margin-bottom: 1em;">
			<a href="/profile/update" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Profile</a> So we know who you are.
		</li>

		<li style="margin-bottom: 1em;">
			{% if user.emergency_contact.telephone %}
				<a href="/profile/emergency-contact" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Emergency Contact</a>
			{% else %}
				<a href="/profile/emergency-contact" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Emergency Contact</a>
			{% endif %} In the unlikely event of an accident.
		</li>

		<li style="margin-bottom: 1em;">
			{% if user.gocardless.mandate_id == '' %}
				<a href="/profile/direct-debit" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Direct Debit</a>
			{% elseif user.gocardless.subscription_id == '' %}
				<a href="/profile/direct-debit" class="btn btn-warning"><span class="glyphicon glyphicon-unchecked"></span> Direct Debit</a>
			{% else %}
				<a href="/profile/direct-debit" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Direct Debit</a>
			{% endif %} So you can pay  your membership fee.
		</li>

		<li style="margin-bottom: 1em;">
			{% if user.discourse.activated %}
				<a href="/profile/discourse" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Discourse</a>
			{% elseif ! user.discourse.activated && user.discourse.username != '' %}
				<a href="/profile/discourse" class="btn btn-warning"><span class="glyphicon glyphicon-unchecked"></span> Discourse</a>
			{% else %}
				<a href="/profile/discourse" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Discourse</a>
			{% endif %} So you can view the members only area on Discourse.
		</li>

		<li>
			{% if user.tag.id == '' %}
				<a href="/profile/tag" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Tag</a>
			{% else %}
				<a href="/profile/tag" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Tag</a>
			{% endif %} So you can use your tag in the space.
		</li>
	</ol>
{% endblock %}
