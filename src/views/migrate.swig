{% extends 'base.swig' %}

{% set title = 'Migration' %}
{% set heading = 'Migration' %}

{% block content %}
	<p>
		Prior to 2016 your account was managed using a different system. To aid existing members, we've created a simple migration process to help you manage your membership more easily.
	</p>
	
	<form method="post">
		
		<h3>Verify your details</h3>
		
		<p>These are the details associated with your account on our legacy system, please update them if necessary.</p>

		<p>
			<label for="firstname">First name: </label>
			<input id="firstname" name="firstname" type="text" class="form-control" required value="{{ legacy.firstname }}" />
		</p>
		
		<p>
			<label for="lastname">Last name: </label>
			<input id="lastname" name="lastname" type="text" class="form-control" required value="{{ legacy.lastname }}" />
		</p>
		
		<p>
			<label for="email">Email: </label>
			<input id="email" name="email" type="email" class="form-control" required value="{{ legacy.email }}" />
		</p>

		<p>
			<label for="address">Address: </label>
			<textarea id="address" rows="4" name="address" class="form-control" required>{{ legacy.address }}</textarea>
		</p>
		
		<h3>Enter your new details</h3>

		<p>We are no longer using Mozilla Persona to manage user login, instead you need to pick a unique username and password to login with in future.</p>

		<p>
			<label for="username">Username: </label>
			<input id="username" name="username" type="text" class="form-control" required />
		</p>
		
		<p>
			<label for="password">Password: </label>
			<input id="password" name="password" type="password" class="form-control" required />
		</p>
		<p>
			<label for="verify">Verify password: </label>
			<input id="verify" name="verify" type="password" class="form-control" required />
		</p>
		
		<p>
			<button class="btn btn-primary">Migrate</button>
		</p>
	</form>
{% endblock %}