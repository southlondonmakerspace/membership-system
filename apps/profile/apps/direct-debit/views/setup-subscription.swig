{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = title %}

{% block content %}
	<p>You have setup a Direct Debit mandate, which authorises us to collect money from your account, the next step is to setup a monthly subscription.</p>

	<div class="page-header">
		<h3>Subscription</h3>
	</div>
	<p>Setting up a subscription will allow us to charge you on a day of your choice each month.</p>
	<form action="/profile/direct-debit/create-subscription" class="form-horizontal" method="post">
		<div class="form-group">
			<label for="amount" class="col-sm-2 control-label">Amount: </label>
			<div class="col-sm-10">
				<div class="input-group">
					<div class="input-group-addon">&pound;</div>
					<input id="amount" name="amount" type="number" class="form-control" value="{{ amount }}" min="{{ amount }}" />
					<div class="input-group-addon">.00</div>
				</div>
				<span id="helpBlock" class="help-block">
					Our minimum membership fee is &pound;20 per month. However, if you cannot afford this, please email <a href="mailto:directors@southlondonmakerspace.org?Subject=Discount">directors@southlondonmakerspace.org</a> and we can discuss alternatives. If you feel that the membership is worth more we invite you to pay what you think it's worth.
				</span>
			</div>
		</div>
		<div class="form-group">
			<label for="day_of_month" class="col-sm-2 control-label">Day of month: </label>
			<div class="col-sm-10">
				<select id="day_of_month" name="day_of_month" class="form-control">
					{% for date in dates  %}
						<option {% if date == next_possible_charge_date %}selected{% endif %}>{{ date }}{% if date == next_possible_charge_date %} &mdash; Earlist possible charge date{% endif %}</option>
					{% endfor %}
					<option value='-1'>Last day of the month</option>
				</select>
				{% if next_possible_charge_date %}
					<span id="helpBlock" class="help-block">Due to the processing times involved in collecting Direct Debit payments, the earliest possible charge date is normally about 7 days from when you setup your mandate, we've preselected this date, however some members prefer to wait until next month in order to setup their payment on a more convenient date aligned with their pay day, this will result in a delay to your membership becoming active.</span>
				{% endif %}
			</div>
		</div>
		<div class="form-group">
			<div class="col-sm-offset-2 col-sm-10">
				<button class="btn btn-primary" role="button">Create Subscription</button>
			</div>
		</div>
	</form>

	<div class="page-header">
		<h3>Mandate</h3>
	</div>

	<p>You can cancel your Direct Debit mandate here or through your bank, this will cancel all pending and future payments.</p>

	<p><a href="/profile/direct-debit/cancel-mandate" class="btn btn btn-danger">Cancel Mandate</a></p>
{% endblock %}
