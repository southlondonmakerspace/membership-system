{% extends '../../../src/views/base.swig' %}

{% set title = 'Member' %}
{% set activeApp = 'members' %}

{% block content %}

	<div class="row">
		<div class="col-md-12">
			<div class="page-header">
				<h2>{{ member.fullname }}</h2>
			</div>

			<p><img style="border-radius: 100%" src="{{ member.gravatar }}?s=150&amp;d=mm&amp;r=g"></p>

			{% if member.discourse.activated %}
				<p><strong>Discourse:</strong> <a target="_blank" href="{{ discourse_path }}/users/{{ discourse.username }}">@{{ discourse.username }}</a></p>
			{% endif %}

			<p><strong>Emergency Contact:</strong> {% if member.emergency_contact.telephone %}Yes, on file{% else %}No, not held{% endif %}</p>
		</div>
	</div>

	<div class="page-header">
		<h3>Permissions</h3>
	</div>

	{% if member.permissions.length > 0 %}
		<div class="list-group">
			{% for permission in member.permissions %}
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
	{% else %}
		<p>Member has no permissions</p>
	{% endif %}

{% endblock %}
