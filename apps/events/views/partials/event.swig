{% if event.member && event.permission %}
	<a href="/members/{{ event.member.uuid }}">{{ event.member.fullname }}</a> <a href="/members/?permission={{ event.permission.slug }}">{{ event.permission.event_name }}</a>.
{% elseif event.activity %}
	{{ event.activity.event_name }}
{% else %}
	{{ event.action }}
{% endif %}

{% if relative %}
	<span class="badge"><time datetime="{{ event.happened | date('Y-m-d\TH:i:s') }}" title="{{ event.happened | date('H:i:s d/m/Y') }}">{{ event.happened_relative }}</time></span>
{% else %}
	<span class="badge"><time datetime="{{ event.happened | date('Y-m-d\TH:i:s') }}" title="{{ event.happened | date('H:i:s d/m/Y') }}">{{ event.happened | date('H:i:s') }}</time></span>
{% endif %}
