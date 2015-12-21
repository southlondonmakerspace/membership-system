<nav class="navbar navbar-default">
	<div class="container-fluid">
		<div class="navbar-header">
			<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
			</button>
			<a class="navbar-brand" href="/"><strong>{{ config.title }}</strong></a>
		</div>

		<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
			{% if user %}
				<ul class="nav navbar-nav">
					{% for app in apps %}
						<li{% if activeApp == app.id %} class="active"{% endif %}><a href="{{ app.path }}">{{ app.title }}</a></li>
					{% endfor %}
				</ul>
				<ul class="nav navbar-nav navbar-right">
					<li><a href="/logout">Logout</a></li>
				</ul>
			{% else %}
				<ul class="nav navbar-nav navbar-right">
					<li{% if activeApp == 'login' %} class="active"{% endif %}><a href="/login">Login</a></li>
					<li{% if activeApp == 'join' %} class="active"{% endif %}><a href="/join">Join</a></li>
				</ul>
			{% endif %}
		</div>
	</div>
</nav>