{% extends '../../../src/views/base.swig' %}

{% set title = 'Permission' %}
{% set heading = permission.name %}
{% set activeApp = 'admin' %}

{% block scripts %}
	{% parent %}
	<script type="text/javascript">
		jQuery(document).ready(function($) {
			$("tr[data-href]").click(function() {
				window.document.location = $(this).data("href");
			});
		});
	</script>
{% endblock %}

{% block content %}
	<p>Members with the "{{ permission.name }}" permission.</p>
	
	<hr />

	{% include '../../admin-members/views/partials/member-table.swig' %}
{% endblock %}