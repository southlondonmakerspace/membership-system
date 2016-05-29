{% extends '../../../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<p><img style="border-radius: 100%" src="{{ discourse_user.avatar }}" /></p>

	<p>Hello there <strong>{{ discourse_user.username }}</strong>!</p>

	<p>Your account is linked with Discourse.</p>
{% endblock %}
