{% extends '../../../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = 'Activate Discourse Link' %}

{% block content %}
	<p>We've sent an activation link to your Discourse Private Messages</p>
	<p>Please click the link or copy the code to link your accounts.</p>

	<form method="post" action="/profile/discourse/activate">
		<p>
			<label for="activation_code">Activation code: </label>
			<input id="activation_code" name="activation_code" type="text" value="{{ activation_code }}" class="form-control" {% if activation_code %}readonly{% endif %} />
		</p>
		
		<p>
			<button class="btn btn-primary">Activate <span class="glyphicon glyphicon-chevron-right"></span></button>
		</p>
	</form>
{% endblock %}
