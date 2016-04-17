{% extends '../../../src/views/base.swig' %}

{% set title = 'GoCardless' %}
{% set heading = 'GoCardless' %}

{% block content %}
	<form method="post">
		<p>
			<label for="id">Subscription ID:</label> <input type="text" value="{{ member.gocardless.id }}" id="id" name="id" class="form-control" />
		</p>
		
		<p>
			<label for="amount">Amount: </label>
			<div class="input-group">
				<div class="input-group-addon">&pound;</div>
				<input id="amount" name="amount" type="number" class="form-control" value="{{ member.gocardless.amount }}" />
				<div class="input-group-addon">.00</div>
			</div>
			<em>Editing this will not change the users subscription amount in GoCardless.</em>
		</p>
		
		<p>
			<label for="minimum">Minimum: </label>
			<div class="input-group">
				<div class="input-group-addon">&pound;</div>
				<input id="minimum" name="minimum" type="number" class="form-control" placeholder="{{ minimum }}" />
				<div class="input-group-addon">.00</div>
			</div>
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}