var __root = __dirname + '/..';
var __config = __root + '/config/config.json';
var __src = __root + '/src';
var __js = __src + '/js';
const daysItTakesToProcessPayments = 2;
const moment = require('moment')
const util = require('util');
const stringify = require('csv-stringify')

var config = require(__config),
    db = require(__js + '/database').connect(config.mongo),
    GoCardless = require(__js + '/gocardless')(config.gocardless);

var Members = db.Members;
const paymentCutoffDate = moment().startOf('day').add(daysItTakesToProcessPayments, 'days');

const columns = [
    "customer_email",
    "billing_first_name",
    "billing_last_name",
    "billing_address_1",
    "billing_address_2",
    "billing_postcode",
    "shipping_first_name",
    "shipping_last_name",
    "shipping_address_1",
    "shipping_address_2",
    "shipping_postcode",
    "subscription_status",
    "start_date",
    "next_payment_date",
    "billing_period",
    "billing_interval",
    "order_items",
    "payment_method",
    "payment_method_title",
    "payment_method_post_meta",
    "customer_note",
    "_old_gocardless_subscription_amount",
    "_old_gocardless_subscription_id",
    "_old_gocardless_mandate_id",
    "_old_permissions"
];

function doubleSquashObject(anArray) {
    const aStringValue = ""
    const stringParts = []
    Object.keys(anArray).forEach((key) => {
        stringParts.push(key + "=" + anArray[key])
    });
    return stringParts.join('+');
}

function squashObject(anArray) {
    const stringParts = []
    Object.keys(anArray).forEach((key) => {
        if (typeof anArray[key] === 'object') {
            stringParts.push(key + doubleSquashObject(anArray[key]))
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

function flattenMember(member) {
    const [address1, address2, postcode] = member.address.split(/[\n\r]/);
    return {
        "customer_email": member.email,
        "billing_first_name": member.firstname,
        "billing_last_name": member.lastname,
        "billing_address_1": `${address1.replace('\n', '')}`,
        "billing_address_2": `${address2.replace('\n', '')}`,
        "billing_postcode": `${postcode.replace('\n', '')}`,
        "shipping_first_name": member.firstname,
        "shipping_last_name": member.lastname,
        "shipping_address_1": `${address1.replace('\n', '')}`,
        "shipping_address_2": `${address2.replace('\n', '')}`,
        "shipping_postcode": `${postcode.replace('\n', '')}`,
        "subscription_status": 'wc-active',
        "start_date": moment(member.joined).format('YYYY-MM-DD HH:mm:ss'),
        "next_payment_date": moment(member.gocardless.next_possible_charge_date).format('YYYY-MM-DD HH:mm:ss'),
        "payment_method": "gocardless",
        "payment_method_title": "Direct Debit",
        "customer_note": "Migrated from SLMS Membership System 2020",
        "_old_gocardless_subscription_amount": member.gocardless.amount,
        "_old_gocardless_subscription_id": member.gocardless.subscription_id,
        "_old_gocardless_mandate_id": member.gocardless.mandate_id,
        "_old_permissions": flattenPermissions(member.permissions)
    };

}
Members.find({
    'gocardless.subscription_id': { $exists: true }
}, async function (err, members) {
    const records = [];
    for (index = 0, len = members.length; index < len; ++index) {
        /*const nextChargeDate = moment(member.gocardless.next_possible_charge_date);
        if (nextChargeDate.isBefore(paymentCutoffDate)) {
            return;
        }*/
        const member = members[index];
        try {
            records.push( flattenMember(member) )
        } catch (e) {
            console.error(e);
        }
    }
    stringify(records, {
        header: true,
        columns
    }, function (err, data) {
        console.log(data);
    })
});