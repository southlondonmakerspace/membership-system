{% extends '../../../src/views/email.html.swig' %}

{% block content %}
	<p>Hello {{ firstname }},</p>
	<p>Thanks for setting up your {{ config.globals.organisation }} membership account!</p>
	<p>Now to confirm your email, just click Activate below, and follow the instructions.</p>
{% endblock %}

{% block action %}
	{% set action = 'Activate' %}
	{% set url = activate_url %}
	{% include '../../../src/views/partials/action.html.swig' %}
{% endblock %}
