{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}

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
	<div class="row">
		<div class="col-md-8">
			<div class="page-header">
				<h2>{{ app.title }}</h2>
			</div>
			<form method="post" style="max-width: 300px;">
				<p>
					<label for="email">Email: </label>
					<input id="email" name="email" type="email" value="{{ user.email }}" class="form-control" />
				</p>
				
				<p>
					<label for="password">Password: </label>
					<input id="password" name="password" type="password" class="form-control" />
				</p>
				
				<p>
					<label for="verify">Verify password: </label>
					<input id="verify" name="verify" type="password" class="form-control" />
				</p>
				
				<p>
					<label for="firstname">First Name: </label>
					<input id="firstname" name="firstname" type="text" value="{{ user.firstname }}" class="form-control" />
				</p>
				
				<p>
					<label for="lastname">Last Name: </label>
					<input id="lastname" name="lastname" type="text" value="{{ user.lastname }}" class="form-control" />
				</p>
				
				<p>
					<label for="address">Address: </label>
					<textarea id="address" name="address" class="form-control">{{ user.address }}</textarea>
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