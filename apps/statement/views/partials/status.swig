{% if payment.status == 'payment_created' %}
	<span class="label label-info">Processing</span>
{% elif payment.status == 'failed' %}
	<span class="label label-danger">Declined</span>
{% elif payment.status == 'paid' %}
	<span class="label label-primary">Collected</span>
{% elif payment.status == 'withdrawn' %}
	<span class="label label-success">Paid</span>
{% else %}
	<span class="label label-default">{{ transaction.status }}</span>
{% endif %}
