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
				<th>First name</th>
				<th>Last name</th>
				<th>Email</th>
				<th>Status</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
			
				<tr title="View Member" data-href="/admin/members/{{ member.id | raw }}" style="cursor: pointer;">
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.email }}</td>
					<td>{% include 'partials/status.swig' %}</td>
					<td>
						<a title="Edit Profile" href="/admin/members/{{ member._id | raw }}/update"><span class="glyphicon glyphicon-pencil"></span></a>
						<a title="Change Password" href="/admin/members/{{ member._id | raw }}/change-password"><span class="glyphicon glyphicon-lock"></span></a>
						<a title="Edit Permissions" href="/admin/members/{{ member._id | raw }}/permissions"><span class="glyphicon glyphicon-tag"></span></a>
						<a title="Edit Tag" href="/admin/members/{{ member._id | raw }}/tag"><span class="glyphicon glyphicon-credit-card"></span></a>
						<a title="Edit GoCardless" href="/admin/members/{{ member._id | raw }}/direct-debit"><span class="glyphicon glyphicon-piggy-bank"></span></a>
						<a title="Edit Discourse" href="/admin/members/{{ member._id | raw }}/discourse"><span class="glyphicon glyphicon-book"></span></a>
					</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}