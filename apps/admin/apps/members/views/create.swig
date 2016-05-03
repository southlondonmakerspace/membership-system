{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Create Member' %}
{% set heading = 'Create Member' %}
{% set activeApp = 'admin' %}

{% block content %}
	<form method="post">
		<h3>Profile</h3>

		<p>
			<label for="email">Email:</label> <input type="email" id="email" name="email" class="form-control" value="{{ member.email }}" required />
		</p>
		
		<p>
			<label for="firstname">First Name:</label> <input type="text" id="firstname" name="firstname" class="form-control" value="{{ member.firstname }}" required />
		</p>
		
		<p>
			<label for="lastname">Last Name:</label> <input type="text" id="lastname" name="lastname" class="form-control" value="{{ member.lastname }}" required />
		</p>
		
		<p>
			<label for="address">Address:</label><br />
			<textarea rows="4" id="address" name="address" class="form-control" required>{{ member.address }}</textarea>
		</p>

		<h3>Tag</h3>
		
		<p>
			<label for="tag">Tag:</label> <input type="text" id="tag" name="tag" value="{{ member.tag.id }}" class="form-control" value="{{ member.tag.id }}" />
		</p>

		<h3>Discourse</h3>
		
		<p>
			<label for="discourse_id">User ID:</label> <input type="text" id="discourse_id" name="discourse_id" class="form-control" value="{{ member.discourse.id }}" />
		</p>
		
		<p>
			<label for="discourse_email">Email:</label> <input type="text" id="discourse_email" name="discourse_email" class="form-control" value="{{ member.discourse.email }}" />
		</p>

		<h3>GoCardless</h3>
		
		<p>
			<label for="gocardless_id">Subscription ID:</label> <input type="text" id="gocardless_id" name="gocardless_id" class="form-control" value="{{ member.gocardless.id }}" />
		</p>
		
		<p>
			<label for="gocardless_amount">Amount:</label>
			<div class="input-group">
				<div class="input-group-addon">&pound;</div>
				<input id="gocardless_amount" name="gocardless_amount" type="number" class="form-control" value="{{ member.gocardless.amount }}" />
				<div class="input-group-addon">.00</div>
			</div>
			<em>Editing this will not change the users subscription amount in GoCardless.</em>
		</p>
		
		<p>
			<button class="btn btn-primary">Create</button>
		</p>
	</form>
{% endblock %}