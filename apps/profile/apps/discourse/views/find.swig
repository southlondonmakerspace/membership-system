{% extends '../../../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = 'Search' %}

{% block content %}
	<p>Search for your Discourse credentials address to start linking your account.</p>

	<form method="get" action="/profile/discourse" style="max-width: 300px;">
		<p>
			<label for="search">Search: </label>
			<input class="form-control" type="text" placeholder="Discourse name, username or email..." id="search" name="search" />
		</p>
		<p>
			<button class="btn btn-primary">Search</button>
		</p>
	</form>

	{% if users %}
		<div class="page-header">
			<h3>Results</h3>
		</div>
		<form method="post" action="/profile/discourse/link">
			<input type="hidden" value="{{ search }}" name="search" />
			{% for user in users %}
				<div class="col-md-2">
					<p><img style="border-radius: 100%" src="{{ user.avatar }}" /></p>
					<p>@<a href="{{ user.profile_link }}" target="_blank">{{ user.username }}</a></p>
					<p>
						<button name="user" class="btn btn-default" value="{{ loop.index0 }}">Link</button>
					</p>
				</div>
			{% endfor %}
		</form>
	{% endif %}

{% endblock %}
