{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<p><img style="border-radius: 100%" src="{{ user.gravatar }}?s=150&d=identicon&r=g"></p>

	<p><strong>Name:</strong> {{ user.fullname }}</p>
	
	<p><strong>Email:</strong> {{ user.email }}</p>

	<p><strong>Address:</strong> {{ user.address | replace('\r\n', ', ', 'gim') }}</p>

	<p>
		<a href="/profile/update" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a> <a href="/profile/change-password" class="btn btn-default"><span class="glyphicon glyphicon-lock"></span> Change Password</a>
	</p>

	<hr />

	<h3>Setup</h3>

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

	<hr />

	{% if user.permissions.length > 0 %}
		<h3>Permissions</h3>
		<ul>
			{% for permission in user.permissions %}
				{% set permission = permission.permission %}
				<li>
					<strong>{{ permission.name }}</strong>
					{% if permission.description %}
						<br />{{ permission.description }}
					{% endif %}
					{% if permission.date_expires %}
						<br />
						Expiry: {{ permission.date_expires | date('d/m/Y') }}
					{% endif %}
				</li>
			{% endfor %}
		</ul>
	{% endif %}
{% endblock %}