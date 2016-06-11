{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	{% if payments.length > 0 %}
		<table class="table table-striped table-hover table-condensed">
			<thead>
				<tr>
					<th>Date</th>
					<th>Description</th>
					<th>Status</th>
					<th>Amount</th>
				</tr>
			</thead>
			<tbody>
				{% for payment in payments %}
					<tr>
						<td>{{ payment.created | date('d/m/Y') }}</td>
						<td>{{ payment.description }}</td>
						<td>{% include 'partials/status.swig' %}</td>
						<td>{% if payment.amount %}&pound;{{ payment.amount }}{% else %}&mdash;{% endif %}</td>
					</tr>
				{% endfor %}
			</tbody>
		</table>
	{% else %}
		<p>You have no payment history at this time.</p>
	{% endif %}
{% endblock %}
