{% extends '../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = 'Setup Mandate' %}

{% block content %}

	<p>The process of setting up your Direct Debit is a simple first we need you to setup a Direct Debit Mandate online with GoCardless our payment processor to allow us to setup a montly subscription.</p>
	
	<a href="/profile/direct-debit/setup-mandate" class="btn btn-primary">Setup Mandate</a>
{% endblock %}