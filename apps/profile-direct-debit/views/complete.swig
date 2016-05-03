{% extends '../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = 'Direct Debit' %}

{% block content %}
	<p>Your Direct Debit mandate and subscription are set up. If you wish to make changes to the subscription, you must cancel it and set it up again.</p>
	
	<a href="/profile/direct-debit/cancel-subscription" class="btn btn-danger">Cancel Subscription</a>
{% endblock %}
