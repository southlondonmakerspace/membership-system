{% extends '../../../src/views/base.swig' %}

{% set title = 'Member' %}
{% set heading = member.fullname %}
{% set activeApp = 'admin' %}

{% block content %}
		<p>
			<a href="/admin/members/{{ member._id | raw }}/update" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span> Edit Profile</a></li>
			<a href="/admin/members/{{ member._id | raw }}/change-password" class="btn btn-default"><span class="glyphicon glyphicon-lock"></span> Change Password</a></li>
			<a href="/admin/members/{{ member._id | raw }}/permissions" class="btn btn-default"><span class="glyphicon glyphicon-tag"></span> Edit Permissions</a></li>
			<a href="/admin/members/{{ member._id | raw }}/tag" class="btn btn-default"><span class="glyphicon glyphicon-credit-card"></span> Edit Tag</a></li>
			<a href="/admin/members/{{ member._id | raw }}/direct-debit" class="btn btn-default"><span class="glyphicon glyphicon-piggy-bank"></span> Edit GoCardless</a></li>
			<a href="/admin/members/{{ member._id | raw }}/discourse" class="btn btn-default"><span class="glyphicon glyphicon-book"></span> Edit Discourse</a></li>
		</p>

		<div class="page-header">
			<h3>Profile</h3>
		</div>
		<p><strong>First Name:</strong> {{ member.firstname }}</p>
		
		<p><strong>Last Name:</strong> {{ member.lastname }}</p>
		
		<p><strong>Email:</strong> {{ member.email }}
		
		<p><strong>Address:</strong> {{ member.address | replace('\r\n', ', ', 'gim') }}</p>
		
		<div class="page-header">
			<h3>Membership System</h3>
		</div>

		<p><strong>ID:</strong> {{ member._id | raw }}</p>

		<p><strong>Joined:</strong> {{ member.joined | date("H:i:s d/m/Y") }}</p>
		
		<p><strong>Activated:</strong> {% if member.activated %}Yes{% else %}No{% endif %}</p>
		
		<p><strong>Activation Code:</strong> {{ member.activation_code }}</p>
		
		<p><strong>Password Reset Code:</strong> {{ member.password_reset_code }}</p>

		<div class="page-header">
			<h3>Tag</h3>
		</div>
		
		<p><strong>Tag:</strong> {{ member.tag }}</p>
		
		<p><strong>Hashed Tag:</strong> {{ member.tag_hashed }}</p>
		
		<div class="page-header">
			<h3>Discourse</h3>
		</div>

		<p><strong>User ID:</strong> {{ member.discourse.id }}</p>
		
		<p><strong>Email:</strong> {{ member.discourse.email }}</p>
		
		<p><strong>Activated:</strong> {% if member.discourse.activation_code == 'activated' %}Yes{% else %}No{% endif %}</p>
		
		<p><strong>Activation Code:</strong> {% if member.discourse.activation_code != 'activated' %}{{ member.discourse.activation_code }}{% endif %}</p>
		
		<div class="page-header">
			<h3>GoCardless</h3>
		</div>

		<p><strong>Subscription ID:</strong> {{ member.gocardless.id }}</p>

		<p><strong>Amount:</strong> &pound;{{ member.gocardless.amount }}</p>

		<div class="page-header">
			<h3>Permissions</h3>
		</div>
		{% if member.permissions.length > 0 %}
			<ul>
				{% for permission in member.permissions %}
					{% set permission = permission.permission %}
					<li>
						<strong>{{ permission.name }}</strong>
						{% if permission.description %}
							<br />{{ permission.description }}<br />
						{% endif %}
						<strong>Start date:</strong> {{ permission.date_added | date('H:i:s d/m/Y') }}<br />
						<strong>Expiry date:</strong> {{ permission.date_expires | date('H:i:s d/m/Y') }}
					</li>
				{% endfor %}
			</ul>
		{% else %}
			<p>User has no permissions</p>
		{% endif %}

		<div class="page-header">
			<h3>Transactions</h3>
		</div>
		{% set transactions = member.gocardless.transactions %}
		{% if transactions.length > 0 %}
			<table class="table table-striped table-hover table-condensed">
				<thead>
					<tr>
						<th>Bill ID</th>
						<th>Subscription ID</th>
						<th>Date</th>
						<th>Description</th>
						<th>Status</th>
						<th>Amount</th>
					</tr>
				</thead>
				<tbody>
					{% for transaction in transactions %}
						<tr>
							<td>{{ transaction.bill_id }}</td>
							<td>{{ transaction.subscription_id }}</td>
							<td>{{ transaction.date| date('H:i:s d/m/Y') }}</td>
							<td>{{ transaction.description }}</td>
							<td>{% include '../../statement/views/partials/status.swig' %}</td>
							<td>&pound;{{ transaction.amount }}</td>
						</tr>
					{% endfor %}
				</tbody>
			</table>
		{% else %}
			<p>You have no transaction history at this time.</p>
		{% endif %}
{% endblock %}