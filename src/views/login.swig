{% extends 'base.swig' %}

{% set title = 'Login' %}
{% set activeApp = 'login' %}

{% block scripts %}
	<script src="https://login.persona.org/include.js" type="text/javascript"></script>
	<script type="text/javascript">
		jQuery( document ).ready( function() {
			jQuery( "#browserid" ).click( function() {
				navigator.id.get( function( assertion ) {
					if ( assertion ) {
						$( "input" ).val( assertion );
						$( "form" ).submit();
					} else {
						location.reload();
					}
				});
			});
		} )
	</script>
	{% parent %}
{% endblock %}

{% block content %}
	<div class="row">
		<div class="col-md-4">
			<div class="page-header">
				<h2>Login</h2>
			</div>
			<form action="post">
				<p></p>
				<p>
					<label for="username">Username: </label>
					<input id="username" name="username" type="text" class="form-control" />
				</p>
				<p>
					<label for="password">Password: </label>
					<input id="password" name="password" type="password" class="form-control" />
				</p>
				<p>
					<label for="remember"><input id="remember" name="remember" type="checkbox" /> Remember me</label>
				</p>
				<p>
					<button class="btn btn-primary" href="#" role="button">Login</button>
				</p>
			</form>
		</div>

		<div class="col-md-4">
			<div class="page-header">
				<h2>Join</h2>
			</div>
			<p>If you are a new around here why not join?</p>
			<p>
				<a class="btn btn-default" href="/join">Join</a>
			</p>
		</div>

		<div class="col-md-4">
			<div class="page-header">
				<h2>Legacy migration</h2>
			</div>
			<p>If you signed up prior to 2-16 you may need to migrate your old account.</p>
			<p>
				<a class="btn btn-default" href="#" role="button" id="browserid">Sign in with Persona</a>
				<form action="/auth/browserid" method="post" style="display:none;"><input type="text" name="assertion"/></form>
			</p>
		</div>
	</div>
{% endblock %}