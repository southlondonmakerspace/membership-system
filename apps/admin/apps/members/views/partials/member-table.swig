{% if members.length > 0 %}
	<p>Members: {{ members.length }}</p>

	<hr />

	<table class="table table-striped table-hover table-condensed">
		<colgroup>
			<col style="width: 5%"></col>
			<col span=2 style="width: 10%"></col>
			<col style="width: 15%"></col>
			<col span=6 style="width: 10%;"></col>
		</colgroup>
		<thead>
			<tr>
				<th>Gravatar</th>
				<th>First name</th>
				<th>Last name</th>
				<th>Email</th>
				{% if access == 'superadmin' %}
					<th>Activation</th>
					<th>Profile</th>
					<th>Discourse</th>
					<th>GoCardless</th>
				{% endif %}
				<th>Tag</th>
				<th>Permissions</th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
				<tr title="View Member " data-href="/admin/members/{{ member.uuid }}" style="cursor: pointer;">
					<td><img style="border-radius: 100%" src="{{ member.gravatar }}?s=50&amp;d=mm&amp;r=g"></td>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.email }}</td>
					{% if access == 'superadmin' %}
						<td>
							<a class="btn btn-sm btn-{% if member.activated %}success{% else %}default{% endif %}" title="Edit Activation" href="/admin/members/{{ member.uuid }}/activation"><span class="glyphicon glyphicon-ok"></span></a>
						</td>
						<td>
							<a class="btn btn-sm btn-default" title="Edit Profile" href="/admin/members/{{ member.uuid }}/update"><span class="glyphicon glyphicon-pencil"></span></a>
						</td>
						<td>
							<a class="btn btn-sm btn-{% if member.discourse.activated %}success{% else %}default{% endif %}" title="Edit Discourse" href="/admin/members/{{ member.uuid }}/discourse"><span class="glyphicon glyphicon-book"></span></a>
						</td>
						<td>
							<a class="btn btn-sm btn-{% if member.gocardless.subscription_id %}success{% else %}default{% endif %}" title="Edit GoCardless" href="/admin/members/{{ member.uuid }}/gocardless"><span class="glyphicon glyphicon-piggy-bank"></span></a>
						</td>
					{% endif %}
					<td>
						<a class="btn btn-sm btn-{% if member.tag.id != '' %}success{% else %}default{% endif %}" title="Edit Tag" href="/admin/members/{{ member.uuid }}/tag"><span class="glyphicon glyphicon-credit-card"></span></a>
					</td>
					<td>
						<a class="btn btn-sm btn-default" title="Edit Permissions" href="/admin/members/{{ member.uuid }}/permissions"><span class="glyphicon glyphicon-tag"></span></a>
					</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% else %}
	<p>No members found.</p>
{% endif %}
