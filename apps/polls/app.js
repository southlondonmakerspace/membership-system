const express = require( 'express' );

const auth = require( __js + '/authentication' );
const { Members, Polls, PollAnswers } = require( __js + '/database' );
const mailchimp = require( __js + '/mailchimp' );
const { hasSchema } = require( __js + '/middleware' );
const { wrapAsync } = require( __js + '/utils' );

const app = express();
var app_config = {};

app.set( 'views', __dirname + '/views' );

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
	if (req.user) {
		const answer = await PollAnswers.findOne( { member: req.user } );
		res.render( 'poll', { answer } );
	} else {
		res.render( 'poll-landing' );
	}
} ) );

app.get( '/campaign2019/:code', wrapAsync( async ( req, res ) => {
	res.render( 'poll', { code: req.params.code } );
} ) );

async function setAnswer( member, { answer, reason, shareable, volunteer, idea } ) {
	const poll = await Polls.findOne();
	await PollAnswers.findOneAndUpdate( { member: member }, {
		$set: {
			poll, member, answer, reason, shareable, volunteer, idea
		}
	}, { upsert: true } );

	await mailchimp.defaultLists.members.update( member.email, {
		merge_fields: {
			CMPGN2019: answer
		}
	} );
}

const answerSchema = {
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
			},
			shareable: {
				type: 'boolean'
			},
			volunteer: {
				type: 'boolean'
			},
			idea: {
				type: 'string'
			},
		}
	}
};

app.post( '/campaign2019', [
	auth.isLoggedIn,
	hasSchema( answerSchema ).orFlash,
], wrapAsync( async ( req, res ) => {
	await setAnswer(req.user, req.body);
	req.flash( 'success', 'polls-answer-chosen' );
	res.redirect( '/polls/campaign2019#' );
} ) );

app.post( '/campaign2019/:code', [
	hasSchema( answerSchema ).orFlash,
	hasSchema( { body: {
		type: 'object',
		required: ['email'],
		properties: {
			email: {
				type: 'string',
				format: 'email'
			}
		}
	} } ).orFlash
], wrapAsync( async ( req, res ) => {
	const member = await Members.findOne( {
		email: req.body.email.trim().toLowerCase(),
		pollsCode: req.params.code
	} );

	if ( member ) {
		await setAnswer(member, req.body);
		req.flash( 'success', 'polls-answer-chosen' );

		res.cookie('memberId', member.uuid, {
			domain: '.thebristolcable.org',
			maxAge: 30 * 24 * 60 * 60 * 1000
		});
	} else {
		req.flash( 'error', 'polls-unknown-user' );
	}

	res.redirect( '/polls/campaign2019/' + req.params.code + '#' );
} ) );

module.exports = config => {
	app_config = config;
	return app;
};
