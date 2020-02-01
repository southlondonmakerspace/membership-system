var __root = __dirname + '/../../';
var __config = __root + '/config/config.json';
var __src = __root + '/src';
var __js = __src + '/js';

var moment = require('moment');
var util = require('util');
var stringify = require('csv-stringify');

var config = require(__config),
    db = require( __js + '/database' );

var Members = db.Members;
var Permissions = db.Permissions;

var columns = [
    "customer_email",
    "first_name",
    "last_name",
    "address",
    "start_date",
    "next_payment_date",
    "payment_method",
    "customer_note",
    "subscription_amount",
    "subscription_id",
    "mandate_id",
    "permissions",
    "emergency_contact_first_name",
    "emergency_contact_last_name",
    "emergency_contact_telephone",
    "tag_id",
    "tag_hashed",
    "signup_override"
];

function flattenPermissions(permissions) {
    const permissionsArray = [];
    permissions.forEach((permission) => {
        permissionsArray.push( permission.permission.toString() );
    });
    return permissionsArray.join('|');
}

function flattenMember(member) {
    return {
        "customer_email": member.email,
        "first_name": member.firstname,
        "last_name": member.lastname,
        "address": member.address.replace(/(?:\r\n|\r|\n)/g, ','),
        "start_date": moment(member.joined).format('YYYY-MM-DD HH:mm:ss'),
        "next_payment_date": moment(member.gocardless.next_possible_charge_date).format('YYYY-MM-DD HH:mm:ss'),
        "payment_method": "gocardless",
        "customer_note": "Migrated from SLMS Membership System 2020",
        "subscription_amount": member.gocardless.amount,
        "subscription_id": member.gocardless.subscription_id,
        "mandate_id": member.gocardless.mandate_id,
        "permissions": flattenPermissions(member.permissions),
        "emergency_contact_first_name": member.emergency_contact.firstname,
        "emergency_contact_last_name": member.emergency_contact.lastname,
        "emergency_contact_telephone": member.emergency_contact.telephone,
        "tag_id": member.tag.id,
        "tag_hashed": member.tag.hashed,
        "signup_override": member.signup_override
    };
}

module.exports = {
    members: function getMembersCsv(callback) {
        Members.find({
            'gocardless.subscription_id': { $exists: true }
        }, function (err, members) {
            var records = [];
            for (index = 0, len = members.length; index < len; ++index) {
                var member = members[index];
                try {
                    records.push( flattenMember(member) );
                } catch (e) {
                    callback(e, null);
                    return;
                }
            }
            stringify(records, {
                header: true,
                columns
            }, function (err, data) {
                if (err) {
                    callback(err, null);
                }
                callback(null, data);
            });
        });
    },
    permissions: function (callback) {
        Permissions.find({}, function (err, permissions) {
            if (err) {
                callback(err);
                return;
            }
            var rows = [];
            var columns = [
                "id",
                "name",
                "slug",
                "description"
            ];
            permissions.forEach(function (permission) {
                try {
                    rows.push( {
                        id: permission.id,
                        name: permission.name,
                        slug: permission.slug,
                        description: permission.description
                    });
                } catch (e) {
                    callback(e, null);
                }
            });
            stringify(rows, {
                header: true,
                columns
            }, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, data);
            });
        });
    }
}
