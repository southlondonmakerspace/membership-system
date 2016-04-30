{% if members.length > 0 %}
	<p>Members: {{ members.length }}</p>
	
	<hr />

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
			
				<tr title="View Member " data-href="/admin/members/{{ member.uuid }}" style="cursor: pointer;">
					<td><img style="border-radius: 100%" src="{{ member.gravatar }}?s=50&amp;d=identicon&amp;r=g"></td>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.email }}</td>
					<td>{% include 'status.swig' %}</td>
					<td>
						<a title="Edit Profile" href="/admin/members/{{ member.uuid }}/update"><span class="glyphicon glyphicon-pencil"></span></a>
					</td>
					<td>
						<a title="Edit Activation" href="/admin/members/{{ member.uuid }}/activation"><span class="glyphicon glyphicon-ok"></span></a>
					</td>
					<td>
						<a title="Change Password" href="/admin/members/{{ member.uuid }}/change-password"><span class="glyphicon glyphicon-lock"></span></a>
					</td>
					<td>
						<a title="Edit Tag" href="/admin/members/{{ member.uuid }}/tag"><span class="glyphicon glyphicon-credit-card"></span></a>
					</td>
					<td>
						<a title="Edit Discourse" href="/admin/members/{{ member.uuid }}/discourse"><span class="glyphicon glyphicon-book"></span></a>
					</td>
					<td>
						<a title="Edit GoCardless" href="/admin/members/{{ member.uuid }}/gocardless"><span class="glyphicon glyphicon-piggy-bank"></span></a>
					</td>
					<td>
						<a title="Edit Permissions" href="/admin/members/{{ member.uuid }}/permissions"><span class="glyphicon glyphicon-tag"></span></a>
					</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% else %}
	<p>No members found.</p>
{% endif %}