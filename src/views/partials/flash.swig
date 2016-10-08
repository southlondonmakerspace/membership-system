{% if ! userSetup %}
	<div class="alert alert-info">You need to finish setting up your account <a href="/profile/setup" class="btn btn-sm btn-primary pull-right" style="margin-top:-.3em;margin-right:-.3em">Finish Setup</a></div>
{% endif %}
{% if flashes %}
	{% for flash in flashes %}
		<div class="alert alert-{{flash.type}}">{{flash.message}}</div>
	{% endfor %}
{% endif %}
