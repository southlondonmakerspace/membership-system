{% extends '../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = 'Cancel Subscription' %}

{% block content %}
	<p>Are you sure you want to cancel your subscription?</p>

	<form method="post">
		<p>
			<button class="btn btn-danger" role="button">Yes, cancel my subscription</button>
			<a href="/profile/direct-debit" class="btn btn-default">No</a>
		</p>
	</form>
{% endblock %}