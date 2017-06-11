jQuery( document ).ready( function( $ ) {
	var options = {
		trigger: 'focus',
		title: 'Password requirements:',
		content: '<p class="pw len">8 characters or more</p><p class="pw up">1 or more uppercase letters</p><p class="pw low">1 or more lowercase letters</p><p class="pw num">1 or more numbers</p><p class="pw mat">Passwords match</p>',
		html: true,
		placement: 'top'
	};
	jQuery( '.pw-req' ).popover( options ).on( 'keyup paste focus', check );
	jQuery( '.pw-mat' ).popover( options ).on( 'keyup paste focus', check );
} );

function check() {
	var pw = jQuery( '.pw-req' ).val();
	var mat = jQuery( '.pw-mat' ).val();

	if ( pw.length < 8 ) {
		jQuery( '.pw.len' ).removeClass( 'pass' );
	} else {
		jQuery( '.pw.len' ).addClass( 'pass' );
	}

	if ( pw.match( /\d/g ) == null ) {
		jQuery( '.pw.num' ).removeClass( 'pass' );
	} else {
		jQuery( '.pw.num' ).addClass( 'pass' );
	}

	if ( pw.match( /[A-Z]/g ) == null ) {
		jQuery( '.pw.up' ).removeClass( 'pass' );
	} else {
		jQuery( '.pw.up' ).addClass( 'pass' );
	}

	if ( pw.match( /[a-z]/g ) == null ) {
		jQuery( '.pw.low' ).removeClass( 'pass' );
	} else {
		jQuery( '.pw.low' ).addClass( 'pass' );
	}

	if ( pw == mat && pw.trim() != '' ) {
		jQuery( '.pw.mat' ).addClass( 'pass' );
	} else {
		jQuery( '.pw.mat' ).removeClass( 'pass' );
	}
}
