# Exporter

The purpose of this app is to export the details of all members in the database into CSV format, to be imported elsewhere.

The columns are roughly similar to that which is required by WooCommerce's import plugin.

## Members CSV file
The fields that are exported are:

- `customer_email`: the email address of the member
- `first_name`: the member's first name
- `last_name`: the member's last name
- `address`: the full address entered by the member
- `postcode`: the postcode of the member (if supplied)
- `start_date`: the date the member first signed up to the system (NOT their first payment)
- `next_payment_date`: the next date that their subscription is due to renew
- `payment_method`: the method by which the member pays their subscription (currently always `gocardless`)
- `customer_note`: A note stating where this record came from
- `_old_gocardless_subscription_amount`: The amount a member pays for their subscription
- `_old_gocardless_subscription_id`: the GoCardless Subscription ID
- `_old_gocardless_mandate_id`: the GoCardless Mandate ID
- `_old_permissions`: an array of permission IDs

Dates are in `YYYY-MM-DD HH:mm:ss` format. 

Permissions are an ordered array, which has been converted into a pipe delimited format.  For example

```
   0:permissionID1|1:permissionID2
```

Each permission ID correlates with a permission available in the other file

## Permissions CSV file

The fields we export are:
- `id`: The ID key of the permission
- `name`: A friendly name for the permission (e.g "Laser Cutter")
- `slug`: A short name for the permission without spaces (e.g. "laser-cutter")
- `description`: A description of what the permission is for
