{% extends 'base.swig' %}

{% block content %}
	<h1>Login</h1>
	{% include 'partials/flash.swig' %}
	
	<form action="/auth/browserid" method="post" style="display:none;">
		<input type="text" name="assertion"/>
	</form>

	<img src="https://developer.mozilla.org/files/3969/plain_sign_in_blue.png" id="browserid"/>
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

{% endblock %}