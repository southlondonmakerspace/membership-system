{% if transaction.status == 'pending' %}
	<span class="label label-info">Pending</span>
{% elif transaction.status == 'failed' %}
	<span class="label label-danger">Failed</span>
{% elif transaction.status == 'paid' %}
	<span class="label label-primary">Paid</span>
{% elif transaction.status == 'withdrawn' %}
	<span class="label label-success">Received</span>
{% else %}
	<span class="label label-default">{{ transaction.status }}</span>
{% endif %}
