{% if flashes %}
	{% for flash in flashes %}
		<div class="alert alert-{{flash.type}}">{{flash.message}}</div>
	{% endfor %}
{% endif %}