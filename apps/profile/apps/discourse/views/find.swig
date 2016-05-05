{% extends '../../../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = 'Find Discourse User' %}

{% block content %}
	{% if discourse_user %}
		<p><img style="border-radius: 100%" src="{{ discourse_user.avatar }}" /></p>

		<p>Hello there, are you <strong>{{ discourse_user.username }}</strong>?</p>

		<form method="post" action="/profile/discourse/link">
			<p>
				<button class="btn btn-primary"><span class="glyphicon glyphicon-check"></span> Yes, link my accounts</button>
			</p>
		</form>
		
		<hr />

		<p>If this is not you please email the trustees for help.</p>
	{% else %}
		<p>The membership system was unable to find a matching Discourse user, please contact the trustees.</p>
	{% endif %}
{% endblock %}