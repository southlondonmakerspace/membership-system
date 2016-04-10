{% extends '../../../src/views/base.swig' %}

{% set title = 'Permissions' %}
{% set activeApp = 'admin' %}

{% block content %}
	<div class="row">
		<div class="col-md-4">
			<div class="page-header">
				<h3>Grant Permission</h3>
			</div>
			{% set action = 'Grant' %}
			{% include 'partials/member-permission-form.swig' %}
		</div>
		<div class="col-md-8">
			<div class="page-header">
				<h3>Permissions</h3>
			</div>
			<div class="list-group">
				{% for permission in member.permissions %}
					{% set permission = permission.permission %}
					<span class="list-group-item">
						<h4 class="list-group-item-heading">{{ permission.name }}</h4>
						<p class="list-group-item-text">{{ permission.description }}</p>
						<p class="list-group-item-text"><strong>Added:</strong> {{ permission.date_added | date('d/m/Y') }}</p>
						{% if permission.date_expires %}
							<p class="list-group-item-text"><strong>Expires:</strong> {{ permission.date_expires | date('d/m/Y') }}
							</p>
						{% endif %}
						<p style="position: absolute; top: 1em; right: 1em;">
							<a href="/admin/members/{{ member._id | raw }}/permissions/{{ loop.index }}/modify" style="margin-right: 1em;"><span class="glyphicon glyphicon-pencil"></span></a>
							<a href="/admin/members/{{ member._id | raw }}/permissions/{{ loop.index }}/revoke"><span class="glyphicon glyphicon-remove"></span></a>
						</p>
					</span>
				{% endfor %}
			</ul>
		</div>
	</div>
{% endblock %}