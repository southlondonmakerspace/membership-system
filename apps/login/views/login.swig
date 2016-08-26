{% extends '../../../src/views/base.swig' %}

{% block navbar %}{% endblock %}

{% set title = app.title %}

{% block scripts %}
	<script src="https://login.persona.org/include.js" type="text/javascript"></script>
	{% parent %}
	<script type="text/javascript">
		jQuery( document ).ready( function() {
			jQuery( "#browserid" ).click( function() {
				navigator.id.get( function( assertion ) {
					if ( assertion ) {
						$( "input" ).val( assertion );
						$( "form" ).submit();
					} else {
						location.reload();
					}
				});
			});
		} )
	</script>
{% endblock %}

{% block content %}
	<div class="row">
		<div class="col-md-8">
			<div class="page-header">
				<h2>{{ app.title }}</h2>
			</div>
			<div class="row">
				<div class="col-md-6">
					{% include 'partials/form.swig' %}
				</div>
			</div>
		</div>

		<div class="col-md-4">
			<div class="page-header">
				<h2>Join</h2>
			</div>
			<p>If you are new around here why not join?</p>
			<p>
				<a class="btn btn-default" href="/join">Join</a>
			</p>
		</div>
	</div>
{% endblock %}
