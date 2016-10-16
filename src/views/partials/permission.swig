<span class="list-group-item{% if permission.date_added > now || permission.date_expires != undefined && permission.date_expires < now %} disabled{% endif %}">
	<h4 class="list-group-item-heading">
		{{ permission.permission.name }}
	</h4>

	{% if permission.permission.description %}
		<p class="list-group-item-text">{{ permission.permission.description }}</p>
	{% endif %}

	<p class="list-group-item-text">
		Valid <time datetime="{{ permission.date_added | date('Y-m-d\TH:i:s') }}" title="{{ permission.date_added | date('H:i:s d/m/Y') }}">{{ permission.date_added | date('d/m/Y') }}</time>
		{% if permission.date_expires %}
			 &mdash;
			<time datetime="{{ permission.date_expires | date('Y-m-d\TH:i:s') }}" title="{{ permission.date_expires | date('H:i:s d/m/Y') }}">{{ permission.date_expires | date('d/m/Y') }}</time>
		{% else %}
			onwards
		{% endif %}
	</p>

	<p style="position: absolute; top: 1em; right: 1em;">
		{% if admin_area %}
			{% if ! permission.permission.superadmin_only || access == 'superadmin' %}
				<a href="/admin/members/{{ member.uuid }}/permissions/{{ permission._id | raw }}/modify" style="margin-right: 1em;"><span class="glyphicon glyphicon-pencil"></span></a>
				<a href="/admin/members/{{ member.uuid }}/permissions/{{ permission._id | raw  }}/revoke"><span class="glyphicon glyphicon-remove"></span></a>
			{% else %}
				<small>Restricted to Super Admins</small>
			{% endif %}
		{% else %}
			{% if now < permission.date_added %}<span class="label label-default">Pending</span>{% endif %}
			{% if permission.date_expires != undefined && now > permission.date_expires %}<span class="label label-default">Expired</span>{% endif %}
		{% endif %}
	</p>
</span>
