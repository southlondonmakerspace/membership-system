var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId,
	crypto = require( 'crypto' );

module.exports = {
	name: 'Members',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		uuid: {
			type: String,
			unique: true,
			default: function () { // pseudo uuid4
				function s4() {
					return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
				}
				return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
			}
		},
		email: {
			type: String,
			required: true,
			unique: true,
			validate: {
				validator: function ( v ) {
					return /[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,}/.test( v );
				},
				message: '{VALUE} is not a valid email address'
			}
		},
		password: {
			hash: {
				type: String,
				required: true
			},
			salt: {
				type: String,
				required: true
			},
			iterations: {
				type: Number,
				default: 1000
			},
			reset_code: {
				type: String
			},
			tries: {
				type: Number,
				default: 0
			}
		},
		otp: {
			key: {
				type: String,
				default: ''
			},
			activated: {
				type: Boolean,
				default: false
			}
		},
		activated: {
			type: Boolean,
			default: false
		},
		signup_override: {
			type: Boolean,
			default: false
		},
		activation_code: {
			type: String,
		},
		firstname: {
			type: String,
			required: true
		},
		lastname: {
			type: String,
			required: true
		},
		address: {
			type: String,
			required: true
		},
		postcode_coordinates: {
			lat: Number,
			lng: Number
		},
		tag: {
			id: {
				type: String
			},
			hashed: {
				type: String,
				required: false
			}
		},
		joined: {
			type: Date,
			default: Date.now,
			required: true
		},
		emergency_contact: {
			firstname: {
				type: String
			},
			lastname: {
				type: String
			},
			telephone: {
				type: String
			}
		},
		discourse: {
			username: String,
			activated: {
				type: Boolean,
				default: false
			},
			activation_code: String,

		},
		gocardless: {
			redirect_flow_id: {
				type: String
			},
			mandate_id: {
				type: String
			},
			subscription_id: {
				type: String
			},
			session_token: {
				type: String
			},
			minimum: {
				type: Number
			},
			next_possible_charge_date: {
				type: Date
			},
			amount: {
				type: Number
			}
		},
		permissions: [ {
			permission: {
				type: ObjectId,
				ref: 'Permissions',
				required: true
			},
			date_added: {
				type: Date,
				default: Date.now,
				required: true
			},
			date_updated: {
				type: Date,
				default: Date.now,
				required: true
			},
			date_expires: {
				type: Date
			},
			admin: {
				type: Boolean,
				default: false
			}
		} ],
		last_seen: Date
	} )
};

module.exports.schema.virtual( 'fullname' ).get( function() {
	return this.firstname + ' ' + this.lastname;
} );

module.exports.schema.virtual( 'gravatar' ).get( function() {
	var md5 = crypto.createHash( 'md5' ).update( this.email ).digest( 'hex' );
	return '//www.gravatar.com/avatar/' + md5;
} );

module.exports.schema.virtual( 'can_admin' ).get( function() {
	var can_admin = [];
	this.permissions.forEach( function( permission, p ) {
		if ( permission.admin )
			can_admin.push( permission.permission.slug )
	} );
	return can_admin;
} );

module.exports.schema.virtual( 'setupComplete' ).get( function() {
	if (	! this.emergency_contact.telephone ||
			! this.gocardless.mandate_id ||
			! this.gocardless.subscription_id ||
			! this.discourse.activated ||
			! this.discourse.username ||
			! this.tag.id
		)
		return false;
	return true;
} );

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
