{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Transactions' %}
{% set heading = 'Transactions' %}
{% set activeApp = 'admin' %}

{% block scripts %}
	{% parent %}
	<script type="text/javascript">
		jQuery(document).ready(function($) {
			$("tr[data-href]").click(function() {
				window.document.location = $(this).data("href");
			});
		});
	</script>
{% endblock %}

{% block content %}
	{% if payments.length > 0 %}
		<table class="table table-striped table-hover table-condensed">
			<thead>
				<tr>
					<th>User</th>
					<th>Payment ID</th>
					<th>Subscription ID</th>
					<th>Created</th>
					<th>Updated</th>
					<th>Charge Date</th>
					<th>Description</th>
					<th>Status</th>
					<th>Amount</th>
				</tr>
			</thead>
			<tbody>
				{% for payment in payments %}
					<tr>
						<td><a href="/admin/members/{{ payment.member.uuid }}">{{ payment.member.fullname }}</a></td>
						<td><a href="https://manage.gocardless.com/payments/{{ payment.payment_id }}" target="_blank">{{ payment.payment_id }}</a></td>
						<td><a href="https://manage.gocardless.com/subscriptions/{{ payment.subscription_id }}" target="_blank">{{ payment.subscription_id }}</a></td>
						<td>{{ payment.created| date('H:i:s d/m/Y') }}</td>
					<td>{% if payment.amount %}{{ payment.updated | date('H:i:s d/m/Y') }}{% else %}&mdash;{% endif %}</td>
						<td>{{ payment.charge_date | date('d/m/Y') }}</td>
						<td>{{ payment.description }}</td>
						<td>{% include '../../../../statement/views/partials/status.swig' %}</td>
						<td>{% if payment.amount %}&pound;{{ payment.amount }}{% else %}&mdash;{% endif %}</td>
					</tr>
				{% endfor %}
			</tbody>
		</table>
	{% else %}
		<p>There is no transaction history</p>
	{% endif %}
{% endblock %}
