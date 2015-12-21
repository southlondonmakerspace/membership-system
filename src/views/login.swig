{% extends 'base.swig' %}

{% set title = 'Login' %}
{% set activeApp = 'login' %}

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

	<p>Sign in here.</p>
	<p><a class="btn btn-primary" href="#" role="button">Sign in</a></p>

	<div class="page-header">
		<h3>Legacy sign in</h3>
	</div>
	<p>If you signed up prior to the end of 2015 you may need to use this legacy sign in.</p>
	<p><a class="btn btn-primary" href="#" role="button" id="browserid">Sign in with Persona</a></p>
	<form action="/auth/browserid" method="post" style="display:none;"><input type="text" name="assertion"/></form>

{% endblock %}