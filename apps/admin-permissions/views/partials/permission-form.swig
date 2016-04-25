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
		<button class="btn btn-primary">{{ action }}</button>
	</p>
</form>