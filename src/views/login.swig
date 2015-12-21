{% extends 'base.swig' %}

{% set title = 'Login' %}
{% set activeApp = 'login' %}

{% block scripts %}
	<script src="https://login.persona.org/include.js" type="text/javascript"></script>
	{% parent %}
{% endblock %}

{% block content %}
	<script>
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

	<div class="row">
		<div class="col-md-8">
			<div class="page-header">
				<h2>Login</h2>
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
					<a class="btn btn-primary" href="#" role="button">Sign in</a>
				</p>
			</form>
		</div>

		<div class="col-md-4">
			<div class="page-header">
				<h2>Legacy sign in</h2>
			</div>
			<p>If you signed up prior to the end of 2015 you may need to use this legacy sign in.</p>
			<p><a class="btn btn-primary" href="#" role="button" id="browserid">Sign in with Persona</a></p>
			<form action="/auth/browserid" method="post" style="display:none;"><input type="text" name="assertion"/></form>
		</div>
	</div>
{% endblock %}