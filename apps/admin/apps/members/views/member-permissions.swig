{% extends '../../../../../src/views/base.swig' %}

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
				{% if member.permissions.length > 0 || superadmin %}
					{% if superadmin %}
						<span class="list-group-item">
							<h4 class="list-group-item-heading">Super Admin</h4>
								<p class="list-group-item-text">Has super admin permission granted in the config.json file.</p>
								<p style="position: absolute; top: 1em; right: 1em;">
									<small>Requires edit to config.json</small>
								</p>
						</span>
					{% endif %}
					{% set admin_area = true %}
					{% for permission in member.permissions %}
						{% include '../../../../../src/views/partials/permission.swig' %}
					{% endfor %}
				{% else %}
					<p>This member has no permissions.</p>
				{% endif %}
			</ul>
		</div>
	</div>
{% endblock %}
