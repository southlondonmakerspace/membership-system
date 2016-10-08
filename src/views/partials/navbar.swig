<nav class="navbar navbar-default">
	<div class="container-fluid">
		<div class="navbar-header">
			<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
				<span class="glyphicon glyphicon-menu-hamburger"></span> Menu
			</button>
			<a class="navbar-brand" href="/"><strong>{{ usersname }}</strong></a>
		</div>

		<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
			<ul class="nav navbar-nav">
				{% for app in apps.main %}
					{% if subapps[app.uid].length > 0 %}
						<li class="dropdown{% if activeApp == app.path %} active{% endif %}">
							<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">{{ app.title }} <span class="caret"></span></a>
							<ul class="dropdown-menu">
								{% if ! app.hidden %}
									<li><a href="/{{ app.path }}">{{ app.title }}</a></li>
								{% endif %}
								{% for subapp in subapps[app.uid] %}
									{% if ! subapp.hidden %}
										<li><a href="/{{ app.path }}/{{ subapp.path }}">{{ subapp.title }}</a></li>
									{% endif %}
								{% endfor %}
							</ul>
						</li>
					{% else %}
						<li{% if activeApp == app.path %} class="active"{% endif %}><a href="/{{ app.path }}">{{ app.title }}</a></li>
					{% endif %}
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
