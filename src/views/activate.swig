{% extends 'base.swig' %}

{% set title = 'Activate' %}
{% set heading = 'Activate' %}

{% block content %}
	<p>Before you can activate your account, please enter your password.</p>
	<form method="post" action="/activate">
		<p>
			<label for="activation_code">Activation code: </label>
			<input id="activation_code" name="activation_code" type="text" value="{{ activation_code }}" class="form-control" {% if activation_code %}readonly{% endif %} />
		</p>
		<p>
			<label for="password">Password: </label>
			<input id="password" name="password" type="password" class="form-control" />
		</p>
		<p>
			<button class="btn btn-primary">Activate <span class="glyphicon glyphicon-chevron-right"></span></button>
		</p>
	</form>
{% endblock %}