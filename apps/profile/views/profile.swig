{% extends '../../../src/views/base.swig' %}

{% set title = 'Profile' %}
{% set heading = 'Profile' %}

{% block content %}
	<p><strong>Name:</strong> {{ user.fullname }}</p>
	
	<p><strong>Email:</strong> {{ user.email }}</p>

	<p><strong>Tag:</strong> {{ user.tag_id | default('No tag associated') }}</p>

	<p><strong>Address:</strong> {{ user.address }}</p>

	<p>
		<a href="/profile/update" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a> <a href="/profile/change-password" class="btn btn-default"><span class="glyphicon glyphicon-lock"></span> Change Password</a>
	</p>

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