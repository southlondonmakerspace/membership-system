{% extends '../../../src/views/base.swig' %}

{% set title = 'Reset Password' %}
{% set heading = 'Reset Password' %}

{% block scripts %}
	{% parent %}
	<script type="text/javascript">
		jQuery(document).ready(function($) {
			jQuery( '#password' ).popover( {
				trigger: 'focus',
				title: 'Password requirements:',
				content: '<p class="pw len">8 characters or more</p><p class="pw up">1 or more uppercase letters</p><p class="pw low">1 or more lowercase letters</p><p class="pw num">1 or more numbers</p>',
				html: true
			} );
			jQuery( '#password' ).on( 'keyup paste', function( e ) {
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
	<form method="post" action="/password-reset/change-password" style="max-width: 300px;">
		<p>
			<label for="password_reset_code">Reset code: </label>
			<input id="password_reset_code" name="password_reset_code" type="text" value="{{ password_reset_code }}" class="form-control" {% if password_reset_code %}readonly{% endif %} />
		</p>
		<p>
			<label for="password">Password:</label> <input type="password" id="password" name="password" class="form-control" required />
		</p>
		<p>
			<label for="verify">Verify:</label> <input type="password" id="verify" name="verify" class="form-control" required />
		</p>
		<p>
			<button class="btn btn-primary">Change Password</button>
		</p>
	</form>
{% endblock %}
