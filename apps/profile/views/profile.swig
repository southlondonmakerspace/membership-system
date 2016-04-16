{% extends '../../../src/views/base.swig' %}

{% set title = 'Profile' %}
{% set heading = 'Profile' %}

{% block content %}
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
		<li style="margin-bottom: 1em;"><a href="/profile/update" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Profile</a></li>

		<li style="margin-bottom: 1em;">
			{% if user.gocardless.id == '' %}
				<a href="/profile/direct-debit" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Direct Debit</a>
			{% else %}
				<a href="/profile/direct-debit" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Direct Debit</a>
			{% endif %}
		</li>
		
		<li style="margin-bottom: 1em;">
			{% if user.discourse.activation_code != 'activated' %}
				<a href="/profile/discourse" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Discourse</a>
			{% else %}
				<a href="/profile/discourse" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Discourse</a>
			{% endif %}
		</li>

		<li>
			{% if user.tag_id == '' %}
				<a href="/profile/tag" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Tag</a>
			{% else %}
				<a href="/profile/tag" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Tag</a>
			{% endif %}
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
						{% if now < permission.date_expires %}
							Expired: 
						{% elif now < permission.date_expires %}
							Expires: 
						{% endif %}
						{{ permission.date_expires | date('d/m/Y') }}
					{% endif %}
				</li>
			{% endfor %}
		</ul>
	{% endif %}
{% endblock %}