{% extends '../../../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}
{% set activeApp = 'admin' %}

{% block content %}
	{% if access == 'superadmin' %}
		<p><a href="/admin/activities/create" class="btn btn-default"><span class="glyphicon glyphicon-plus"></span> Create Activity</a></p>
	{% endif %}
	<table class="table table-striped table-condensed">
		<thead>
			<tr>
				<th>Name</th>
				<th>Slug</th>
				{% if access == 'superadmin' %}
						<th></th>
				{% endif %}
			</tr>
		</thead>
		<tbody>
			{% for activity in activities %}
				<tr>
					<td>{{ activity.name }}</td>
					<td>{{ activity.slug }}</td>
					{% if access == 'superadmin' %}
						<td><a href="/admin/activities/{{ activity.slug }}/edit"><span class="glyphicon glyphicon-pencil"></span></a></td>
					{% endif %}
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}
