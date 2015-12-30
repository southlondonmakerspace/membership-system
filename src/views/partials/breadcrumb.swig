{% if breadcrumb.length > 0 %}
	<ol class="breadcrumb">
		<li><a href="/">Home</a></li>
		{% for crumb in breadcrumb %}
			{% if crumb.url && ! loop.last %}
				<li><a href="{{ crumb.url }}">{{ crumb.name }}</a></li>
			{% else %}
				<li>{{ crumb.name }}</li>
			{% endif %}
		{% endfor %}
	</ol>
{% endif %}