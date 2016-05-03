{% extends '../../../../../src/views/base.swig' %}

{% set title = 'GoCardless' %}
{% set heading = 'GoCardless' %}

{% block content %}
	<form method="post">
		<p>
			<label for="mandate_id">Mandate ID:</label> <input type="text" value="{{ member.gocardless.mandate_id }}" id="mandate_id" name="mandate_id" class="form-control" />
		</p>
		<p>
			<label for="subscription_id">Subscription ID:</label> <input type="text" value="{{ member.gocardless.subscription_id }}" id="subscription_id" name="subscription_id" class="form-control" />
		</p>
		
		<p>
			<label for="minimum">Minimum: </label>
			<div class="input-group">
				<div class="input-group-addon">&pound;</div>
				<input id="minimum" name="minimum" type="number" class="form-control" placeholder="{{ minimum }}" value="{{ member.gocardless.minimum }}" />
				<div class="input-group-addon">.00</div>
			</div>
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}