{% extends '../../../src/views/base.swig' %}

{% set title = 'Permissions' %}
{% set heading = 'Permissions' %}
{% set activeApp = 'admin' %}

{% block content %}
	<p><a href="/admin/permissions/create" class="btn btn-default"><span class="glyphicon glyphicon-plus"></span> Create Permission</a></p>
	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>Name</th>
				<th>Slug</th>
				<th>Description</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{% for permission in permissions %}
				<tr>
					<td>{{ permission.name }}</td>
					<td>{{ permission.slug }}</td>
					<td>{{ permission.description }}</td>
					<td><a href="/admin/permissions/{{ permission._id | raw }}/edit"><span class="glyphicon glyphicon-pencil"></span></a></td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}