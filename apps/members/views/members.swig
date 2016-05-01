{% extends '../../../src/views/base.swig' %}

{% set title = app.title %}
{% set heading = app.title %}

{% block scripts %}
	{% parent %}
	<script type="text/javascript">
		jQuery(document).ready(function($) {
			$("tr[data-href]").click(function() {
				window.document.location = $(this).data("href");
			});
		});
		jQuery( document ).ready( function () {
			jQuery.extend( jQuery.expr[":"], {
				"containsIN": function(elem, i, match, array ) {
				return ( elem.textContent || elem.innerText || "" ).toLowerCase().indexOf( ( match[3] || "" ).toLowerCase() ) >= 0;
				}
			} );

			jQuery( "#filter" ).on( "input", function () {
				// split the current value of searchInput
				var data = this.value.split( " " );
				
				// create a jquery object of the rows
				var jo = $( "tbody" ).find( "tr" );
				
				if ( this.value == "" ) {
					jo.show();
					return;
				}

				// hide all the rows
				jo.hide();

				// Recusively filter the jquery object to get results.
				jo.filter( function ( i, v ) {
					var $t = jQuery( this );
					for ( var d = 0; d < data.length; ++d ) {
						if ( $t.is( ":containsIN('" + data[d] + "')" ) ) {
							return true;
						}
					}
					return false;
				}).show();
			});
		});
	</script>
{% endblock %}

{% block content %}
	<p>Active members: {{ members.length }}</p>

	<hr />

	<input id="filter" placeholder="Filter" class="form-control" style="max-width: 200px" />

	<hr />

	<table class="table table-striped table-hover table-condensed">
		<thead>
			<tr>
				<th>Gravatar</th>
				<th>First name</th>
				<th>Last name</th>
				<th>Joined</th>
				<th>Emergency Contact</th>
			</tr>
		</thead>
		<tbody>
			{% for member in members %}
				<tr title="View Member " data-href="/members/{{ member.uuid }}" style="cursor: pointer;">
					<td><img style="border-radius: 100%" src="{{ member.gravatar }}?s=75&d=identicon&r=g"></td>
					<td>{{ member.firstname }}</td>
					<td>{{ member.lastname }}</td>
					<td>{{ member.joined | date('d/m/Y') }}</td>
					<td>{% if member.emergency_contact.telephone %}Yes{% else %}No{% endif %}</td>
				</tr>
			{% endfor %}
		</tbody>
	</table>
{% endblock %}