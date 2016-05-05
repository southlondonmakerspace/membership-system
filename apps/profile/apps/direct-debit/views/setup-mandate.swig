{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = 'Setup Mandate' %}

{% block content %}

	<p>Setting up your Direct Debit is simple. First, setup a Direct Debit Mandate with our payment processor GoCardless which will allow us to setup a montly subscription.</p>
	
	<a href="/profile/direct-debit/setup-mandate" class="btn btn-primary">Setup Mandate</a>
{% endblock %}
