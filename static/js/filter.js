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

		$( '.member_count' ).text( $( "tbody" ).find( "tr:visible" ).length );
	});
});
