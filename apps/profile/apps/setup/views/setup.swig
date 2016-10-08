{% extends '../../../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<ol style="padding-left: 2em;">
		<li style="margin-bottom: 1em;">
			<a href="/profile/update" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Profile</a> So we know who you are.
		</li>

		<li style="margin-bottom: 1em;">
			{% if user.emergency_contact.telephone %}
				<a href="/profile/emergency-contact" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Emergency Contact</a>
			{% else %}
				<a href="/profile/emergency-contact" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Emergency Contact</a>
			{% endif %} In the unlikely event of an accident.
		</li>

		<li style="margin-bottom: 1em;">
			{% if user.gocardless.mandate_id == '' %}
				<a href="/profile/direct-debit" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Direct Debit</a>
			{% elseif user.gocardless.subscription_id == '' %}
				<a href="/profile/direct-debit" class="btn btn-warning"><span class="glyphicon glyphicon-unchecked"></span> Direct Debit</a>
			{% else %}
				<a href="/profile/direct-debit" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Direct Debit</a>
			{% endif %} So you can pay  your membership fee.
		</li>

		<li style="margin-bottom: 1em;">
			{% if user.discourse.activated %}
				<a href="/profile/discourse" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Discourse</a>
			{% elseif ! user.discourse.activated && user.discourse.username != '' %}
				<a href="/profile/discourse" class="btn btn-warning"><span class="glyphicon glyphicon-unchecked"></span> Discourse</a>
			{% else %}
				<a href="/profile/discourse" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Discourse</a>
			{% endif %} So you can view the members only area on Discourse.
		</li>

		<li>
			{% if user.tag.id == '' %}
				<a href="/profile/tag" class="btn btn-danger"><span class="glyphicon glyphicon-unchecked"></span> Tag</a>
			{% else %}
				<a href="/profile/tag" class="btn btn-success"><span class="glyphicon glyphicon-check"></span> Tag</a>
			{% endif %} So you can use your tag in the space.
		</li>
	</ol>
{% endblock %}
