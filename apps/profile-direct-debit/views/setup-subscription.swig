{% extends '../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = 'Setup Subscription' %}

{% block content %}
	<p>You've setup a Direct Debit Mandate, that authorises us to collect money from your account through GoCardless, but now we need to setup a monthly subscription against your mandate.</p>
	
	<form action="/profile/direct-debit/create-subscription" method="post">
		<p>
			<label for="amount">Amount: </label>
			<div class="input-group">
				<div class="input-group-addon">&pound;</div>
				<input id="amount" name="amount" type="number" class="form-control" value="{{ amount }}" min="{{ amount }}" />
				<div class="input-group-addon">.00</div>
			</div>
		</p>
		
		<p>
			<label for="day_of_month">Day of month: </label>
			<select id="day_of_month" name="day_of_month" class="form-control">
				<option value='-1'>Last day of the month</option>
				<option selected>1</option>
				<option>2</option>
				<option>3</option>
				<option>4</option>
				<option>5</option>
				<option>6</option>
				<option>7</option>
				<option>8</option>
				<option>9</option>
				<option>10</option>
				<option>11</option>
				<option>12</option>
				<option>13</option>
				<option>14</option>
				<option>15</option>
				<option>16</option>
				<option>17</option>
				<option>18</option>
				<option>19</option>
				<option>20</option>
				<option>21</option>
				<option>22</option>
				<option>23</option>
				<option>24</option>
				<option>25</option>
				<option>26</option>
				<option>27</option>
				<option>28</option>
			</select>
		</p>
		
		<p>
			<button class="btn btn-primary" role="button">Create Subscription</button>
		</p>
	</form>

	<hr />

	<h3>Mandate</h3>

	<p>Having setup a Direct Debit mandate we can use this to setup payments and subscriptions against your account, you can cancel this here or through your bank.</p>
	
	<p><a href="/profile/direct-debit/cancel-mandate" class="btn btn-danger">Cancel Mandate</a></p>
{% endblock %}