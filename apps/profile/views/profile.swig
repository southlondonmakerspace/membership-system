{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<p><img style="border-radius: 100%" src="{{ user.gravatar }}?s=150&d=mm&r=g"></p>

	<p><strong>Name:</strong> {{ user.fullname }}</p>

	<p><strong>Email:</strong> {{ user.email }}</p>

	<p><strong>Address:</strong> {{ user.address | replace('\r\n', ', ', 'gim') }}</p>

	<p>
		<a href="/profile/update" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a> <a href="/profile/change-password" class="btn btn-default"><span class="glyphicon glyphicon-lock"></span> Change Password</a>
	</p>

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
			{% elseif ! user.discourse.activated && user.discourse.id != '' %}
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

	{% if user.permissions.length > 0 %}
		<div class="page-header">
			<h3>Permissions</h3>
		</div>
		<div class="list-group">
			{% for permission in user.permissions %}
				{% set permission = permission.permission %}
				<span class="list-group-item">
					<h4 class="list-group-item-heading">{{ permission.name }}</h4>
					{% if permission.description %}
						<p class="list-group-item-text">{{ permission.description }}</p>
					{% endif %}
					<p class="list-group-item-text"><strong>Start date:</strong> {{ permission.date_added | date('H:i:s d/m/Y') }}</p>
					{% if permission.date_expires %}
						<p class="list-group-item-text"><strong>Expiry date:</strong> {{ permission.date_expires | date('H:i:s d/m/Y') }}</p>
					{% endif %}
				</span>
			{% endfor %}
		</div>
	{% endif %}
{% endblock %}
