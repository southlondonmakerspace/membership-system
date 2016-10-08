{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Member' %}
{% set activeApp = 'admin' %}

{% block content %}

	<div class="row">
		<div class="col-md-6">
			<div class="page-header">
				<h2>{{ member.fullname }}</h2>
			</div>

			<p><img style="border-radius: 100%" src="{{ member.gravatar }}?s=150&amp;d=mm&amp;r=g"></p>

			<p><strong>First Name:</strong> {{ member.firstname }}</p>

			<p><strong>Last Name:</strong> {{ member.lastname }}</p>

			<p><strong>Email:</strong> {{ member.email }}</p>

			{% if access == 'superadmin' %}
				<p><strong>Address:</strong> {{ member.address | replace('\r\n', ', ', 'gim') }}</p>

				<p><a href="/admin/members/{{ member.uuid }}/update" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a></p>
			{% endif %}
		</div>
		{% if access == 'superadmin' %}
			<div class="col-md-6">
				<div class="page-header">
					<h3 style="padding-top: 6px;">Emergency Contact</h3>
				</div>

				<p><strong>First Name:</strong> {{ member.emergency_contact.firstname | default('–')  }}</p>

				<p><strong>Last Name:</strong> {{ member.emergency_contact.lastname | default('–')  }}</p>

				<p><strong>Telephone:</strong> {{ member.emergency_contact.telephone | default('–')  }}
			</div>

		{% endif %}
	</div>

	<div class="row">
		<div class="col-md-6">
			<div class="page-header">
				<h3>Membership System</h3>
			</div>

			<p><strong>UUID:</strong> {{ member.uuid }}</p>

			{% if access == 'superadmin' %}
				<p><strong>DB ID:</strong> {{ member._id | raw }}</p>
			{% endif %}

				<p><strong>Joined:</strong> {{ member.joined | date("H:i:s d/m/Y") }}</p>

				<p><strong>Activated:</strong> {% if member.activated %}Yes{% else %}No{% endif %}</p>

			{% if access == 'superadmin' %}
				<p><strong>Activation Code:</strong> {{ member.activation_code | default('–') }} {% if member.activation_code %}&mdash; {{ audience }}/activate/{{ member.activation_code }}{% endif %}
				</p>

				<p><strong>Password Reset Code:</strong> {{ member.password_reset_code | default('–') }} {% if member.password_reset_code %}&mdash; {{ audience }}/password-reset/code/{{ member.password_reset_code }}{% endif %}</p>

				<p><strong>Password Tries:</strong> {{ member.password.tries | default('–') }} / {{ password_tries }} {% if member.password.tries > password_tries %} - Locked{% endif %}</p>

				<p><a href="/admin/members/{{ member.uuid }}/activation" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a></p>
			{% endif %}
		</div>

		<div class="col-md-6">
			<div class="page-header">
				<h3>Tag</h3>
			</div>

			<p><strong>Tag:</strong> {{ member.tag.id | default('–') }}</p>

			{% if access == 'superadmin' %}
				<p><strong>Hashed Tag:</strong> {{ member.tag.hashed | default('–') }}</p>
			{% endif %}

			<p><a href="/admin/members/{{ member.uuid }}/tag" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a></p>
		</div>
	</div>

	{% if access == 'superadmin' %}
		<div class="row">
			<div class="col-md-6">
				<div class="page-header">
					<h3>Discourse</h3>
				</div>

				<p><strong>Username:</strong> {{ member.discourse.username | default('–') }}</p>

				<p><strong>Activated:</strong> {% if member.discourse.activated %}Yes{% else %}No{% endif %}</p>

				<p><strong>Activation Code:</strong> {{ member.discourse.activation_code | default('–') }} {% if member.discourse.activation_code %}&mdash; {{ audience }}/profile/discourse?code={{ member.discourse.activation_code }}{% endif %}

				<p><a href="/admin/members/{{ member.uuid }}/discourse" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a></p>
			</div>

			<div class="col-md-6">
				<div class="page-header">
					<h3>GoCardless</h3>
				</div>

				<p><strong>Mandate ID:</strong> {{ member.gocardless.mandate_id | default('–') }}</p>

				<p><strong>Subscription ID:</strong> {{ member.gocardless.subscription_id | default('–') }}</p>

				<p><strong>Minimum:</strong> &pound;{{ member.gocardless.minimum | default('–') }}</p>

				{% if member.gocardless.next_possible_charge_date %}
					<p><strong>Earliest charge date:</strong> {{ member.gocardless.next_possible_charge_date | date('d/m/Y') }}</p>
				{% endif %}

				<p><a href="/admin/members/{{ member.uuid }}/gocardless" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a></p>
			</div>
		</div>
	{% endif %}

	<div class="page-header">
		<h3>Permissions</h3>
	</div>

	{% if member.permissions.length > 0 || superadmin %}
		<div class="list-group">
			{% if superadmin %}
				<span class="list-group-item">
					<h4 class="list-group-item-heading">Super Admin</h4>
						<p class="list-group-item-text">Has super admin permission granted in the config.json file.</p>
				</span>
			{% endif %}
			{% for permission in member.permissions %}
				{% set permission = permission.permission %}
				<span class="list-group-item">
					<h4 class="list-group-item-heading">{{ permission.name }}</h4>
					{% if permission.description %}
						<p class="list-group-item-text">{{ permission.description }}</p>
					{% endif %}
					<p class="list-group-item-text"><strong>Start date:</strong> {{ permission.date_added | date('H:i:s d/m/Y') }}</p>
					{% if permission.date_expires %}
						<p class="list-group-item-text"><strong>Expiry date:</strong> {{ permission.date_expires | date('H:i:s d/m/Y') }}</p>
					{% endif %}
				</span>
			{% endfor %}
		</div>
	{% else %}
		<p>Member has no permissions</p>
	{% endif %}

	<p><a href="/admin/members/{{ member.uuid }}/permissions" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit</a></p>

	{% if access == 'superadmin' %}
		<div class="page-header">
			<h3>Payments</h3>
		</div>
		{% if payments.length > 0 %}
			<table class="table table-striped table-hover table-condensed">
				<thead>
					<tr>
						<th>Payment ID</th>
						<th>Subscription ID</th>
						<th>Created</th>
						<th>Updated</th>
						<th>Charge Date</th>
						<th>Description</th>
						<th>Status</th>
						<th>Amount</th>
					</tr>
				</thead>
				<tbody>
					{% for payment in payments %}
						<tr>
							<td>{{ payment.payment_id }}</td>
							<td>{{ payment.subscription_id }}</td>
							<td>{{ payment.created| date('H:i:s d/m/Y') }}</td>
						<td>{% if payment.amount %}{{ payment.updated | date('H:i:s d/m/Y') }}{% else %}&mdash;{% endif %}</td>
							<td>{{ payment.charge_date | date('d/m/Y') }}</td>
							<td>{{ payment.description }}</td>
							<td>{% include '../../../../profile/apps/statement/views/partials/status.swig' %}</td>
							<td>{% if payment.amount %}&pound;{{ payment.amount }}{% else %}&mdash;{% endif %}</td>
						</tr>
					{% endfor %}
				</tbody>
			</table>
		{% else %}
			<p>Member has no payment history</p>
		{% endif %}
	{% endif %}
{% endblock %}
