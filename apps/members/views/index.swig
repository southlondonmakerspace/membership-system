{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<p>Active members: {{ members.length }}</p>
	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>First name</th>
				<th>Last name</th>
				<th>Joined</th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
				<tr>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.joined | date('d/m/Y') }}</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}