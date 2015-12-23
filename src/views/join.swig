{% extends 'base.swig' %}

{% set title = 'Join' %}
{% set activeApp = 'join' %}

{% block content %}
	<div class="row">
		<div class="col-md-8">
			<div class="page-header">
				<h2>Join</h2>
			</div>
			<form action="post">
				<p>
					<label for="username">Username: </label>
					<input id="username" name="username" type="text" class="form-control" />
				</p>
				<p>
					<label for="password">Password: </label>
					<input id="password" name="password" type="password" class="form-control" />
				</p>
				<p>
					<label for="password2">Confirm: </label>
					<input id="password2" name="password2" type="password" class="form-control" />
				</p>
				<p>
					<label for="email">Email: </label>
					<input id="email" name="email" type="email" class="form-control" />
				</p>
				<p>
					<label for="address">Address: </label>
					<textarea id="address" name="address" class="form-control"></textarea>
				</p>
				<p>
					<button class="btn btn-primary">Next <span class="glyphicon glyphicon-chevron-right"></span></button>
				</p>
			</form>
		</div>

		<div class="col-md-4">
			<div class="page-header">
				<h2>Login</h2>
			</div>
			<p>If you are already a member you need to login...</p>
			<p>
				<a class="btn btn-default" href="/login">Login</a>
			</p>
		</div>
	</div>
{% endblock %}