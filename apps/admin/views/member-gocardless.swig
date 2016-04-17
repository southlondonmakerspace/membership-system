{% extends '../../../src/views/base.swig' %}

{% set title = 'GoCardless' %}
{% set heading = 'GoCardless' %}

{% block content %}
	<form method="post">
		<p>
			<label for="id">Subscription ID:</label> <input type="text" value="{{ member.gocardless.id }}" id="id" name="id" class="form-control" />
		</p>

		<p>
			<label for="amount">Amount:</label> <input type="text" value="{{ member.gocardless.amount }}" id="amount" name="amount" class="form-control" />
			<em>Editing this will not change the users subscription amount in GoCardless.</em>
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}