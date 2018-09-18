const __root = '../..';
const __src = __root + '/src';
const __js = __src + '/js';
const __config = __root + '/config';

const express = require( 'express' );

const auth = require( __js + '/authentication' );
const { Members, RestartFlows } = require( __js + '/database' );
const mandrill = require( __js + '/mandrill' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const config = require( __config + '/config.json' );

const { processJoinForm, customerToMember, createJoinFlow, completeJoinFlow, createMember, startMembership } = require( './utils' );

const { joinSchema, completeSchema } = require( './schemas.json' );

const app = express();

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/' , function( req, res ) {
	res.render( 'index', { user: req.user } );
} );

const gifts3 = [{
	id: 'tshirt',
	name: 'T-shirt'
}, {
	id: 'mug',
	name: 'Mug'
}, {
	id: 'voucher',
	name: 'Voucher'
}];

const gifts5 = [{
	id: 'blah',
	name: 'Blah'
}, {
	id: 'blah2',
	name: 'Blah 2'
}];

app.get( '/r/:code', wrapAsync( async function( req, res ) {
	const referrer = await Members.findOne( { referral_code: req.params.code } );
	if ( referrer ) {
		res.render( 'index', { user: req.user, referrer, gifts3, gifts5 } );
	} else {
		res.redirect( '/join' );
	}
} ) );

app.post( '/', [
	auth.isNotLoggedIn,
	hasSchema(joinSchema).orFlash
], wrapAsync(async function( req, res ) {
	const joinForm = processJoinForm(req.body);
	const completeUrl = config.audience + app.mountpath + '/complete';
	const redirectUrl = await createJoinFlow(completeUrl, joinForm);

	res.redirect( redirectUrl );
}));

app.get( '/complete', [
	auth.isNotLoggedIn,
	hasSchema(completeSchema).orRedirect( '/join' )
], wrapAsync(async function( req, res ) {
	const {customerId, mandateId, joinForm} = await completeJoinFlow(req.query.redirect_flow_id);

	const memberObj = await customerToMember(customerId, mandateId);

	try {
		const newMember = await createMember(memberObj);
		await startMembership(newMember, joinForm);
		await mandrill.sendToMember('welcome', newMember);

		req.login(newMember, function ( loginError ) {
			if ( loginError ) {
				throw loginError;
			}
			res.redirect('/profile/complete');
		});
	} catch ( saveError ) {
		// Duplicate email
		if ( saveError.code === 11000 ) {
			const oldMember = await Members.findOne({email: memberObj.email});
			if (oldMember.gocardless.subscription_id) {
				res.redirect( app.mountpath + '/duplicate-email' );
			} else {
				const code = auth.generateCode();

				await RestartFlows.create( {
					code,
					member: oldMember._id,
					customerId,
					mandateId,
					joinForm
				} );

				await mandrill.sendToMember('restart-membership', oldMember, {code});

				res.redirect( app.mountpath + '/expired-member' );
			}
		} else {
			throw saveError;
		}
	}
}));

app.get('/restart/:code', wrapAsync(async (req, res) => {
	const {member, customerId, mandateId, joinForm} =
		await RestartFlows.findOneAndRemove({'code': req.params.code}).populate('member').exec();

	// Something has created a new subscription in the mean time!
	if (member.gocardless.subscription_id) {
		req.flash( 'danger', 'gocardless-subscription-exists' );
	} else {
		member.gocardless = {
			customer_id: customerId,
			mandate_id: mandateId
		};
		await member.save();

		await startMembership(member, joinForm);
		req.flash( 'success', 'gocardless-subscription-restarted' );
	}

	req.login(member, function ( loginError ) {
		if ( loginError ) {
			throw loginError;
		}
		res.redirect('/profile');
	});
}));

app.get('/expired-member', (req, res) => {
	res.render('expired-member');
});

app.get('/duplicate-email', (req, res) => {
	res.render('duplicate-email');
});

module.exports = function( config ) {
	app_config = config;
	return app;
};
