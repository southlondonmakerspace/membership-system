{% if transaction.status == 'pending' %}
	<span class="label label-info">Processing</span>
{% elif transaction.status == 'failed' %}
	<span class="label label-danger">Declined</span>
{% elif transaction.status == 'paid' %}
	<span class="label label-primary">Collected</span>
{% elif transaction.status == 'withdrawn' %}
	<span class="label label-success">Paid</span>
{% else %}
	<span class="label label-default">{{ transaction.status }}</span>
{% endif %}
