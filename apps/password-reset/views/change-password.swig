{% extends '../../../src/views/base.swig' %}

{% set title = 'Reset Password' %}
{% set heading = 'Reset Password' %}

{% block content %}
	<form method="post" action="/password-reset/change-password">
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