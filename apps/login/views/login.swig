{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}

{% block scripts %}
	<script src="https://login.persona.org/include.js" type="text/javascript"></script>
	{% parent %}
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
{% endblock %}

{% block content %}
	<div class="row">
		<div class="col-md-6">
			<div class="page-header">
				<h2>{{ app.title }}</h2>
			</div>
			<form method="post">
				<p></p>
				<p>
					<label for="email">Email: </label>
					<input id="email" name="email" type="text" class="form-control" />
				</p>
				<p>
					<label for="password">Password: </label>
					<input id="password" name="password" type="password" class="form-control" />
				</p>
				<p>
					<button class="btn btn-primary" role="button">Login</button>
					<a class="btn btn-default" href="/password-reset" role="button">Password Reset</a>
				</p>
			</form>
		</div>

		<div class="col-md-6">
			<div class="page-header">
				<h2>Join</h2>
			</div>
			<p>If you are a new around here why not join?</p>
			<p>
				<a class="btn btn-default" href="/join">Join</a>
			</p>
		</div>
	</div>
{% endblock %}