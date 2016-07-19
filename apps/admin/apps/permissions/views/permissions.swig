{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Permissions' %}
{% set heading = 'Permissions' %}
{% set activeApp = 'admin' %}

{% block scripts %}
	{% parent %}
	<script type="text/javascript">
		jQuery(document).ready(function($) {
			$("tr[data-href]").click(function() {
				window.document.location = $(this).data("href");
			});
		});
	</script>
{% endblock %}

{% block content %}
	{% if access == 'superadmin' %}
		<p><a href="/admin/permissions/create" class="btn btn-default"><span class="glyphicon glyphicon-plus"></span> Create Permission</a></p>
	{% endif %}
	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>Name</th>
				<th>Slug</th>
				<th>Description</th>
				<th>Linked to Discourse Group</th>
				<th>Restricted to Super Admin</th>
				{% if access == 'superadmin' %}
						<th></th>
				{% endif %}
			</tr>
		</thead>
		<tbody>
			{% for permission in permissions %}
				<tr data-href="/admin/permissions/{{ permission.slug }}" style="cursor: pointer;">
					<td>{{ permission.name }}</td>
					<td>{{ permission.slug }}</td>
					<td>{{ permission.description }}</td>
					<td>{% if permission.group.id && permission.group.name %}Yes{% else %}No{% endif %}</td>
					<td>{% if permission.superadmin_only %}Yes{% else %}No{% endif %}</td>
							{% if access == 'superadmin' %}
								<td><a href="/admin/permissions/{{ permission.slug }}/edit"><span class="glyphicon glyphicon-pencil"></span></a></td>
					{% endif %}
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}
