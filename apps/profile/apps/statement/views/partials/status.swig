{% if payment.status == 'payment_created' %}<span class="label label-default" title="{{ payment.status }}">Scheduled</span>
{% elif payment.status == 'payment_submitted' %}<span class="label label-info" title="{{ payment.status }}">Processing</span>
{% elif payment.status == 'payment_confirmed' %}<span class="label label-primary" title="{{ payment.status }}">Collected</span>
{% elif payment.status == 'payment_paid_out' %}<span class="label label-success" title="{{ payment.status }}">Paid</span>
{% elif payment.status == 'mandate_cancelled' %}<span class="label label-danger" title="{{ payment.status }}">Cancelled</span>
{% elif payment.status == 'bank_account_closed' %}<span class="label label-danger" title="{{ payment.status }}">Cancelled</span>
{% else %}<span class="label label-default">{{ payment.status }}</span>
{% endif %}
