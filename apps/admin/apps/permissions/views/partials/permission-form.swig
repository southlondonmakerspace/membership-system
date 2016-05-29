<form method="post">
	<p>
		<label for="name">Name: </label>
		<input id="name" name="name" type="text" value="{{ permission.name }}" required class="form-control" />
	</p>

	<p>
		<label for="slug">Slug: </label>
		<input id="slug" name="slug" type="text" value="{{ permission.slug }}" required class="form-control" />
	</p>

	<p>
		<label for="description">Description: </label>
		<input id="description" name="description" type="text" value="{{ permission.description }}" class="form-control" />
	</p>

	<p>
		<label for="superadmin_only">Require Super Admin: </label>
	<input {% if permission.superadmin_only %}checked{% endif %} id="superadmin_only" name="superadmin_only" type="checkbox" class="form-control" />
		<small>Should granting, editing and modifcation of this permission be limited to Super Admin users?</small>
	</p>

	<h3>Discourse Group</h3>

	<p>
		<label for="group_id">ID: </label>
		<input id="group_id" name="group_id" type="text" value="{{ permission.group.id }}" class="form-control" />
	</p>

	<p>
		<label for="group_name">Name: </label>
		<input id="group_name" name="group_name" type="text" value="{{ permission.group.name }}" class="form-control" />
	</p>

	<p>
		<button class="btn btn-primary">{{ action }}</button>
	</p>
</form>
