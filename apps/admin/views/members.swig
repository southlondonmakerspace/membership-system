{% extends '../../../src/views/base.swig' %}

{% set title = 'Members' %}
{% set heading = 'Members' %}
{% set activeApp = 'admin' %}

{% block content %}
	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>First name</th>
				<th>Last name</th>
				<th>Username</th>
				<th>Status</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
				<tr>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.username }}</td>
					<td>{% include 'partials/status.swig' %}</td>
					<td><a href="/admin/members/{{ member._id | raw }}/edit"><span class="glyphicon glyphicon-pencil"></span></a> <a href="/admin/members/{{ member._id | raw }}/permissions"><span class="glyphicon glyphicon-lock"></span></a></td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}