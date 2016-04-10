{% extends '../../../src/views/base.swig' %}

{% set title = 'Members' %}
{% set heading = 'Members' %}

{% block content %}
	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>First name</th>
				<th>Last name</th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
				<tr>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}