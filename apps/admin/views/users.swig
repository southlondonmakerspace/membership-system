{% extends '../../../src/views/base.swig' %}

{% set title = 'Users' %}
{% set heading = 'Users' %}
{% set activeApp = 'admin' %}

{% block content %}
	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>First name</th>
				<th>Last name</th>
				<th>Username</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{% for user in users %}
				<tr>
					<td>{{ user.firstname }}</td>
					<td>{{ user.lastname }}</td>
					<td>{{ user.username }}</td>
					<td><a href="/admin/users/{{ user._id | raw }}/edit"><span class="glyphicon glyphicon-pencil"></span></a></td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}