const express = require( 'express' );

const auth = require( __js + '/authentication' );
const { Polls, PollAnswers } = require( __js + '/database' );
const mailchimp = require( __js + '/mailchimp' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const app = express();
var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( auth.isLoggedIn );

app.use( ( req, res, next ) => {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', ( req, res ) => {
	res.redirect( '/polls/campaign2019' );
} );

app.get( '/campaign2019', wrapAsync( async ( req, res ) => {
	const answer = await PollAnswers.findOne( { member: req.user } );
	res.render( 'poll', { answer } );
} ) );

const schema = {
	body: {
		type: 'object',
		required: ['answer'],
		properties: {
			answer: {
				type: 'string',
				enum: ['1', '2']
			},
			reason: {
				type: 'string'
			}
		}
	}
};

app.post( '/campaign2019', hasSchema( schema ).orFlash, wrapAsync( async ( req, res ) => {
	const poll = await Polls.findOne();
	await PollAnswers.findOneAndUpdate( { member: req.user }, {
		$set: {
			poll,
			member: req.user,
			answer: req.body.answer,
			reason: req.body.reason
		}
	}, { upsert: true } );

	await mailchimp.defaultLists.members.update( req.user.email, {
		merge_fields: {
			CMPGN2019: req.body.answer
		}
	} );

	req.flash( 'success', 'polls-answer-chosen' );
	res.redirect( '/polls/campaign2019' );
} ) );

module.exports = config => {
	app_config = config;
	return app;
};
