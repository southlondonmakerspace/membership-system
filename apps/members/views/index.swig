{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<p>Active members: {{ members.length }}</p>
	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>Gravatar</th>
				<th>First name</th>
				<th>Last name</th>
				<th>Joined</th>
				<th>Emergency Contact</th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
				<tr>
					<td><img src="{{ member.gravatar }}?s=75&d=identicon&r=g"></td>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.joined | date('d/m/Y') }}</td>
					<td>{% if member.emergency_contact.telephone %}Yes{% else %}No{% endif %}</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}