{% extends '../../../src/views/base.swig' %}

{% set title = 'Member' %}
{% set activeApp = 'members' %}

{% block content %}

	<div class="page-header">
		<h2>{{ member.fullname }}</h2>
	</div>

	<div class="row">
		<div class="col-md-2">
			<p><img style="border-radius: 100%" src="{{ member.gravatar }}?s=150&amp;d=mm&amp;r=g"></p>
		</div>
		<div class="col-md-2">
			{% if member.discourse.activated %}
				<p class="pull-right"><strong>Discourse:</strong></p>
			{% endif %}

			<p class="pull-right"><strong>Emergency Contact:</strong></p>
		</div>
		<div class="col-md-8">
			{% if member.discourse.activated %}
				<p><a target="_blank" href="{{ discourse_path }}/users/{{ discourse.user.username }}">@{{ discourse.user.username }}</a></p>
			{% endif %}

			<p>{% if member.emergency_contact.telephone %}On file{% else %}Not held{% endif %}</p>
		</div>
	</div>

	<div class="page-header">
		<h3>Permissions</h3>
	</div>

	{% if member.permissions.length > 0 %}
		<div class="list-group">
			{% for permission in member.permissions %}
				{% include '../../../src/views/partials/permission.swig' %}
			{% endfor %}
		</div>
	{% else %}
		<p>Member has no permissions</p>
	{% endif %}

{% endblock %}
