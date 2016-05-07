{% extends '../../../src/views/base.swig' %}

{% set title = 'Change Password' %}
{% set heading = 'Change Password' %}

{% block scripts %}
	{% parent %}
	<script type="text/javascript">
		jQuery(document).ready(function($) {
			jQuery( '#new' ).popover( {
				trigger: 'focus', 
				title: 'Password requirements:',
				content: '<p class="pw len">8 characters or more</p><p class="pw up">1 or more uppercase letters</p><p class="pw low">1 or more lowercase letters</p><p class="pw num">1 or more numbers</p>',
				html: true
			} );
			jQuery( '#new' ).on( 'keyup paste', function( e ) {
				var pw = jQuery( this ).val();
				
				if ( pw.length < 8 ) {
					jQuery( '.pw.len' ).removeClass( 'pass');
				} else {
					jQuery( '.pw.len' ).addClass( 'pass');
				}

				if ( pw.match( /\d/g ) == null ) {
					jQuery( '.pw.num' ).removeClass( 'pass');
				} else {
					jQuery( '.pw.num' ).addClass( 'pass');
				}

				if ( pw.match( /[A-Z]/g ) == null ) {
					jQuery( '.pw.up' ).removeClass( 'pass');
				} else {
					jQuery( '.pw.up' ).addClass( 'pass');
				}

				if ( pw.match( /[a-z]/g ) == null ) {
					jQuery( '.pw.low' ).removeClass( 'pass');
				} else {
					jQuery( '.pw.low' ).addClass( 'pass');
				}
			} );
		} );
	</script>
{% endblock %}

{% block stylesheets %}
	{% parent %}
	<style>
		.pw {
			line-height: normal;
			margin-bottom: 0.5em;
		}

		.pw:last-child {
			margin-bottom: 0;
		}

		.pw:before {
			font-family: "Glyphicons Halflings";
			content: "\e014";
			color: #d9534f;
			margin-right: 0.5em;
			vertical-align: middle;
		}

		.pw.pass:before {
			content: "\e013";
			color: #5cb85c;
		}
	</style>
{% endblock %}

{% block content %}
	<form method="post" style="max-width: 300px;">
		<p>
			<label for="current">Current password:</label> <input type="password" id="current" name="current" class="form-control" required />
		</p>
		
		<p>
			<label for="new">New password:</label> <input type="password" id="new" name="new" class="form-control" required />
		</p>
		
		<p>
			<label for="verify">Verify new password:</label> <input type="password" id="verify" name="verify" class="form-control" required />
		</p>
		
		<p>
			<button class="btn btn-primary">Update Password</button>
		</p>
	</form>
{% endblock %}