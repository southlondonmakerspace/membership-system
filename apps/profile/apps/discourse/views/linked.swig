{% extends '../../../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<p><img style="border-radius: 100%" src="{{ discourse_user.avatar }}" /></p>

	<p>Hello there <a target="_blank" href="{{ discourse_path }}/users/{{ discourse_user.user.username }}">@{{ discourse_user.user.username }}</a>.</p>

	<p>Your account is linked with Discourse.</p>
{% endblock %}
