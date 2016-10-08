{% extends '../../../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block content %}
	<div class="list-group">
		{% for permission in permissions %}
			<span class="list-group-item">
				<h4 class="list-group-item-heading"><a href="/members?permission={{ permission.slug }}">{{ permission.name }}</a></h4>
				{% if permission.description %}
					<p class="list-group-item-text">{{ permission.description }}</p>
				{% endif %}
				<p style="position: absolute; top: 1em; right: .15em;">
					{% if permission.granted %}
						<span class="label label-success" style="margin-right: 1em;"><span class="glyphicon glyphicon-ok"></span> Granted</span>
					{% endif %}
				</p>
			</span>
		{% endfor %}
	</div>
{% endblock %}
