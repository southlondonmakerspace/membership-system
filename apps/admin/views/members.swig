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
				<th>Email</th>
				<th>Status</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
				<tr>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.email }}</td>
					<td>{% include 'partials/status.swig' %}</td>
					<td>
						<a href="/admin/members/{{ member._id | raw }}/update"><span class="glyphicon glyphicon-pencil"></span></a>
						<a href="/admin/members/{{ member._id | raw }}/permissions"><span class="glyphicon glyphicon-lock"></span></a>
						<a href="/admin/members/{{ member._id | raw }}/tag"><span class="glyphicon glyphicon-credit-card"></span></a>
						<a href="/admin/members/{{ member._id | raw }}/direct-debit"><span class="glyphicon glyphicon-piggy-bank"></span></a>
						<a href="/admin/members/{{ member._id | raw }}/discourse"><span class="glyphicon glyphicon-book"></span></a>
					</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}