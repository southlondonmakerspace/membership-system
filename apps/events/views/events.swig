{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}

{% block content %}
	<div class="row">
		<div class="col-md-3">
			<h3 style="margin-bottom: 0; font-weight: normal;">{{ app.title }}:</h3>
			<h1 style="margin-top: 0; margin-bottom: 0;">{{ searchDate | date('F') }}</h1>
			<h2 style="margin-top: 0;">{{ searchDate | date('Y') }}</h2>
			<nav aria-label="...">
				<ul class="pager">
					<li class="previous"><a href="?year={{ previous | date('Y') }}&month={{ previous | date('m') }}"><span aria-hidden="true">&larr;</span> {{ previous | date('F') }}</a></li>
					<li class="next"><a href="?year={{ next | date('Y') }}&month={{ next | date('m') }}">{{ next | date('F') }} <span aria-hidden="true">&rarr;</span></a></li>
				</ul>
			</nav>
		</div>
		<div class="col-md-9">
				{% for event in events %}
					{% if now.getDay() == event.happened.getDay() %}
						{% set relative = true %}
					{% endif %}

					{% if loop.first || event.split %}
						{% if event.split %}
							{% set relative = false %}
								</ul>
							</div>
						{% endif %}
						<div class="panel panel-default">
							<div class="panel-heading">
								<h3 class="panel-title">{{ event.happened | date('l dS F Y') }}{% if now.getDay() == event.happened.getDay() %}<span class="badge pull-right">Today</span>{% endif %}</h3>
							</div>
							<ul class="list-group">
					{% endif %}
					<li class="list-group-item">
						{% if event.member && event.permission %}
							<a href="/members/{{ event.member.uuid }}">{{ event.member.fullname }}</a> <a href="/members/?permission={{ event.permission.slug }}">{{ event.permission.event_name }}</a>.
						{% else %}
							{{ event.action }}
						{% endif %}
						{% if relative %}
							<span class="badge"><time datetime="{{ event.happened | date('Y-m-d\TH:i:s') }}" title="{{ event.happened | date('H:i:s d/m/Y') }}">{{ event.happened_relative }}</time></span>
						{% else %}
							<span class="badge"><time datetime="{{ event.happened | date('Y-m-d\TH:i:s') }}" title="{{ event.happened | date('H:i:s d/m/Y') }}">{{ event.happened | date('H:i:s') }}</time></span>
						{% endif %}
					</li>
				{% if loop.end %}
					{% set relative = false %}
						</ul>
					</div>
				{% endif %}
			{% endfor %}
		</div>
	</div>
{% endblock %}
