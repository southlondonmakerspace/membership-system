{% extends '../../../src/views/email.html.swig' %}

{% block content %}
	<p>Hello {{ firstname }},</p>
	<p>Someone has requested a password reset email on your account.</p>
	<p>To change your password, just click below, and follow the instructions.</p>
{% endblock %}

{% block action %}
	{% set action = 'Change Password' %}
	{% set url = reset_url %}
	{% include '../../../src/views/partials/action.html.swig' %}
{% endblock %}
