{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Direct Debit' %}
{% set heading = title %}

{% block content %}
	<p>The first step to becoming an active member is to setup a Direct Debit mandate with our payment provider, GoCardless.</p>

	<div class="page-header">
		<h3>Mandate</h3>
	</div>

	<p>When you select to setup your mandate by clicking the button below, we will redirect you to our payment provider's secure form to collect your details without revealing them to us, this keeps your details secure in the hands of experts.</p>

	<a href="/profile/direct-debit/setup-mandate" class="btn btn-primary">Setup Mandate</a>
{% endblock %}
