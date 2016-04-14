{% extends '../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = 'Direct Debit' %}

{% block content %}
	{% if gocardless.id == '' %}
		<h3>Setup Direct Debit</h3>

		<p>We use <a href="https://gocardless.com/">GoCardless</a> as our payment processor as they only charge a flat 1% fee for collecting payments compared with credit/debit card processing fees or the administrative burden of BACs reconcilliation each month.</p>

		<p>They will securely guide you through the process of setting up a recurring monthly direct debit of your chosen amount below</p>

		<form action="/direct-debit/setup" method="post">
			<p>
				<label for="amount">Amount: </label>
				<div class="input-group">
					<div class="input-group-addon">&pound;</div>
					<input id="amount" name="amount" type="number" class="form-control" value="{{ amount }}" min="{{ amount }}" />
					<div class="input-group-addon">.00</div>
				</div>
			</p>
			<p>
				<button class="btn btn-primary" role="button">Setup Direct Debit</button>
			</p>
		</form>
	{% else %}
		<p>Your direct debit is setup for &pound;{{ gocardless.amount }}, if you wish to make changes cancel it and setup a new direct debit.</p>
		<a href="/direct-debit/cancel" class="btn btn-danger">Cancel Direct Debit</a>
	{% endif %}
{% endblock %}