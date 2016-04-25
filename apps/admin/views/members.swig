{% extends '../../../src/views/base.swig' %}

{% set title = 'Members' %}
{% set heading = 'Members' %}
{% set activeApp = 'admin' %}

{% block scripts %}
	{% parent %}
	<script type="text/javascript">
		jQuery(document).ready(function($) {
			$("tr[data-href]").click(function() {
				window.document.location = $(this).data("href");
			});
		});
	</script>
{% endblock %}

{% block content %}
	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>Gravatar</th>
				<th>First name</th>
				<th>Last name</th>
				<th>Email</th>
				<th>Status</th>
				<th>Profile</th>
				<th>Activation</th>
				<th>Password</th>
				<th>Tag</th>
				<th>Discourse</th>
				<th>GoCardless</th>
				<th>Permissions</th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
			
				<tr title="View Member " data-href="/admin/members/{{ member.id | raw }}" style="cursor: pointer;">
					<td><img src="{{ member.gravatar }}?s=50&d=identicon&r=g"></td>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.email }}</td>
					<td>{% include 'partials/status.swig' %}</td>
					<td>
						<a title="Edit Profile" href="/admin/members/{{ member._id | raw }}/update"><span class="glyphicon glyphicon-pencil"></span></a>
					</td>
					<td>
						<a title="Edit Activation" href="/admin/members/{{ member._id | raw }}/activation"><span class="glyphicon glyphicon-ok"></span></a>
					</td>
					<td>
						<a title="Change Password" href="/admin/members/{{ member._id | raw }}/change-password"><span class="glyphicon glyphicon-lock"></span></a>
					</td>
					<td>
						<a title="Edit Tag" href="/admin/members/{{ member._id | raw }}/tag"><span class="glyphicon glyphicon-credit-card"></span></a>
					</td>
					<td>
						<a title="Edit Discourse" href="/admin/members/{{ member._id | raw }}/discourse"><span class="glyphicon glyphicon-book"></span></a>
					</td>
					<td>
						<a title="Edit GoCardless" href="/admin/members/{{ member._id | raw }}/gocardless"><span class="glyphicon glyphicon-piggy-bank"></span></a>
					</td>
					<td>
						<a title="Edit Permissions" href="/admin/members/{{ member._id | raw }}/permissions"><span class="glyphicon glyphicon-tag"></span></a>
					</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}