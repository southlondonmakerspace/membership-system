<nav class="navbar navbar-default">
	<div class="container-fluid">
		<div class="navbar-header">
			<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
			</button>
			<a class="navbar-brand" href="/"><strong>{{ usersname }}</strong></a>
		</div>

		<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
			<ul class="nav navbar-nav">
				{% for app in apps.main %}
					<li{% if activeApp == app.path %} class="active"{% endif %}><a href="/{{ app.path }}">{{ app.title }}</a></li>
				{% endfor %}
			</ul>
			<ul class="nav navbar-nav navbar-right">
				{% for app in apps.secondary %}
					<li{% if activeApp == app.path %} class="active"{% endif %}><a href="/{{ app.path }}">{{ app.title }}</a></li>
				{% endfor %}
			</ul>
		</div>
	</div>
</nav>
