<form method="post">
	<p>
		<label for="permission">Permission: </label>
		<select class="form-control" id="permission" name="permission">
			<option disabled selected>&mdash;</option>
			{% for permission in permissions %}
			<option {% if permission.slug == current.permission.slug %}selected{% endif %} value="{{ permission.slug }}" {% if permission.superadmin_only && access != 'superadmin' %}disabled{% endif %}>{{ permission.name }}{% if permission.superadmin_only && access != 'superadmin' %} &mdash; Restricted to Super Admins{% endif %}</option>
			{% endfor %}
		</select>
	</p>
	<p>
		<label>Start: </label><br />
		{% if current.date_added %}
			<input type="time" name="start_time" value="{{ current.date_added | date('H:i') }}" class="form-control" style="display: inline; width: auto;"  />
			<input type="date" name="start_date" value="{{ current.date_added | date('Y-m-d') }}" class="form-control" style="display: inline; width: auto;"  />
		{% else %}
			<input type="time" name="start_time" value="{{ now | date('H:i') }}" class="form-control" style="display: inline; width: auto;"  />
			<input type="date" name="start_date" value="{{ now | date('Y-m-d') }}" class="form-control" style="display: inline; width: auto;"  />
		{% endif %}
	</p>
	<p>
		<label>Expires: </label><br />
		{% if current.date_expires %}
			<input type="time" name="expiry_time" value="{{ current.date_expires | date('H:i') }}" class="form-control" style="display: inline; width: auto;"  />
			<input type="date" name="expiry_date" value="{{ current.date_expires | date('Y-m-d') }}" class="form-control" style="display: inline; width: auto;"  />
		{% else %}
			<input type="time" name="expiry_time" class="form-control" style="display: inline; width: auto;"  />
			<input type="date" name="expiry_date" class="form-control" style="display: inline; width: auto;"  />
		{% endif %}
	</p>
	<p>
		<button class="btn btn-primary">{{ action }}</button>
	</p>
</form>
