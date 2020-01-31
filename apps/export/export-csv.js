var __root = __dirname + '/../../';
var __config = __root + '/config/config.json';
var __src = __root + '/src';
var __js = __src + '/js';

var moment = require('moment');
var util = require('util');
var stringify = require('csv-stringify');

var config = require(__config),
    db = require(__js + '/database').connect(config.mongo);

var Members = db.Members;
var Permissions = db.Permissions;

function doubleSquashObject(anArray) {
    const stringParts = [];
    Object.keys(anArray).forEach((key) => {
        stringParts.push(key + "=" + anArray[key]);
    });
    return stringParts.join('+');
}

function squashObject(anArray) {
    const stringParts = [];
    Object.keys(anArray).forEach((key) => {
        if (typeof anArray[key] === 'object') {
            stringParts.push(key + doubleSquashObject(anArray[key]));
        } else {
            stringParts.push(key + ":" + anArray[key]);
        }
    });
    return stringParts.join('|');
}

function flattenPermissions(permissions) {
    const permissionsArray = [];
    permissions.forEach((permission) => {
        permissionsArray.push( permission.permission.toString() );
    })
    return squashObject(permissionsArray);
}

var columns = [
    "customer_email",
    "first_name",
    "last_name",
    "address",
    "postcode",
    "start_date",
    "next_payment_date",
    "order_items",
    "payment_method",
    "customer_note",
    "_old_gocardless_subscription_amount",
    "_old_gocardless_subscription_id",
    "_old_gocardless_mandate_id",
    "_old_permissions"
];

function flattenMember(member) {
    const [address1, address2, postcode] = member.address.split(/[\n\r]/);
    return {
        "customer_email": member.email,
        "first_name": member.firstname,
        "last_name": member.lastname,
        "address": `${address1.replace('\n', '')}`,
        "postcode": `${postcode.replace('\n', '')}`,
        "start_date": moment(member.joined).format('YYYY-MM-DD HH:mm:ss'),
        "next_payment_date": moment(member.gocardless.next_possible_charge_date).format('YYYY-MM-DD HH:mm:ss'),
        "payment_method": "gocardless",
        "customer_note": "Migrated from SLMS Membership System 2020",
        "_old_gocardless_subscription_amount": member.gocardless.amount,
        "_old_gocardless_subscription_id": member.gocardless.subscription_id,
        "_old_gocardless_mandate_id": member.gocardless.mandate_id,
        "_old_permissions": flattenPermissions(member.permissions)
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
                    records.push( flattenMember(member) )
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
            })
        });
    },
    permissions: function (callback) {
        Permissions.find({}, function (err, permissions) {
            if (err) {
                callback(err);
                return;
            }
            var rows = []
            var columns = [
                "id",
                "name",
                "slug",
                "description"
            ]
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
                header: true
            }, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, data);
            })
        })
    }
}