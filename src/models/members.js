const mongoose = require( 'mongoose' );
const crypto = require( 'crypto' );

const { getActualAmount } = require('../js/utils');
const { permission: { memberId } } = require( '../../config/config.json' );

const ObjectId = mongoose.Schema.ObjectId;

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
			lowercase: true,
			validate: {
				validator: function ( v ) {
					return /[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,}/.test( v );
				},
				message: '{VALUE} is not a valid email address'
			}
		},
		referralCode: {
			type: String,
			unique: true,
			sparse: true
		},
		loginOverride: {
			code: String,
			expires: Date
		},
		password: {
			hash: {
				type: String,
			},
			salt: {
				type: String,
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
		firstname: {
			type: String,
			required: true
		},
		lastname: {
			type: String,
			required: true
		},
		delivery_optin: {
			type: Boolean
		},
		delivery_address: {
			line1: {
				type: String
			},
			line2: {
				type: String,
			},
			city: {
				type: String,
			},
			postcode: {
				type: String
			},
		},
		billing_location: {
			lat: Number,
			lng: Number
		},
		delivery_location: {
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
		discourse: {
			username: String,
			activated: {
				type: Boolean,
				default: false
			},
			activation_code: String,

		},
		gocardless: {
			customer_id: String,
			mandate_id: String,
			subscription_id: String,
			amount: Number,
			period: {
				type: String,
				enum: ['monthly', 'annually']
			},
			cancelled_at: Date
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
			date_expires: {
				type: Date
			},
			admin: {
				type: Boolean,
				default: false
			}
		} ],
		last_seen: Date,
		join_reason: String,
		join_how: String,
		join_shareable: Boolean,
		cancellation: {
			satisfied: Number,
			reason: String,
			other: String
		},
		exports: [ {
			export_id: {
				type: ObjectId,
				ref: 'Exports',
				required: true
			},
			status: {
				type: String,
				required: true
			}
		} ]
	} )
};

module.exports.schema.virtual( 'fullname' ).get( function() {
	return this.firstname + ' ' + this.lastname;
} );

module.exports.schema.virtual( 'gravatar' ).get( function() {
	var md5 = crypto.createHash( 'md5' ).update( this.email ).digest( 'hex' );
	return '//www.gravatar.com/avatar/' + md5;
} );

module.exports.schema.virtual( 'gocardless.actualAmount' ).get( function () {
	return getActualAmount(this.gocardless.amount, this.gocardless.period);
} );

module.exports.schema.virtual( 'can_admin' ).get( function() {
	var can_admin = [];
	this.permissions.forEach( function( permission ) {
		if ( permission.admin )
			can_admin.push( permission.permission.slug );
	} );
	return can_admin;
} );

module.exports.schema.virtual( 'memberPermission' )
	.get( function () {
		return this.permissions.find(p => p.permission.equals(memberId));
	} )
	.set( function (value) {
		// Ensure permission is always member
		const memberPermission = {...value, permission: memberId};

		const i = this.permissions.findIndex(p => p.permission.equals(memberId));
		if (i > -1) {
			this.permissions[i] = memberPermission;
		} else {
			this.permissions.push(memberPermission);
		}
	} );

module.exports.schema.virtual( 'isActiveMember' )
	.get( function () {
		const now = new Date();
		return this.memberPermission && this.memberPermission.date_added < now &&
			(!this.memberPermission.date_expires || this.memberPermission.date_expires > now);
	} );

module.exports.schema.virtual( 'setupComplete' ).get( function() {
	if ( ! this.password.hash )
		return false;
	return true;
} );

module.exports.schema.virtual( 'referralLink' ).get( function () {
	return 'https://thebristolcable.org/refer/' + this.referralCode;
} );

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
