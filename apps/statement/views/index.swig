{% extends '../../../src/views/base.swig' %}

{% set title = 'Statement' %}
{% set heading = 'Statement' %}

{% block content %}
	{% if transations.length > 0 %}
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
				{% for transaction in transactions %}
					<tr>
						<td>{{ transaction.date| date('d/m/Y') }}</td>
						<td>{{ transaction.description }}</td>
						<td>{{ transaction.status }}</td>
						<td>{{ transaction.amount }}</td>
					</tr>
				{% endfor %}
			</tbody>
		</table>
	{% else %}
		<p>You have no transaction history at this time.</p>
	{% endif %}
{% endblock %}