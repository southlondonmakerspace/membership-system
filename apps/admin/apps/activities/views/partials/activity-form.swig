<form method="post">
	<p>
		<label for="name">Name: </label>
		<input id="name" name="name" type="text" value="{{ activity.name }}" required class="form-control" />
	</p>

	<p>
		<label for="event">Event: </label>
		<input id="event" name="event" type="text" value="{{ activity.event_name }}" class="form-control" />
	</p>

	<p>
		<label for="slug">Slug: </label>
		<input id="slug" name="slug" type="text" value="{{ activity.slug }}" required class="form-control" />
	</p>

	<p>
		<button class="btn btn-primary">{{ action }}</button>
	</p>
</form>
