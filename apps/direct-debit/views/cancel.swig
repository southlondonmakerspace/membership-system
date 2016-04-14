{% extends '../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = 'Cancel Direct Debit' %}

{% block content %}
	<p>Are you sure you want to cancel your direct debit?</p>

	<form method="post">
		<p>
			<button class="btn btn-danger" role="button">Yes, cancel my direct debit</button>
			<a href="/direct-debit" class="btn btn-default">No</a>
		</p>
	</form>
{% endblock %}