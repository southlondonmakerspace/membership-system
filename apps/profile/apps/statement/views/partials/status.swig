{% if payment.status == 'payment_created' %}<span class="label label-default">Scheduled</span>
{% elif payment.status == 'payment_submitted' %}<span class="label label-info">Processing</span>
{% elif payment.status == 'payment_confirmed' %}<span class="label label-primary">Collected</span>
{% elif payment.status == 'payment_paid_out' %}<span class="label label-success">Paid</span>
{% elif payment.status == 'mandate_cancelled' %}<span class="label label-danger">Cancelled</span>
{% else %}<span class="label label-default">{{ payment.status }}</span>
{% endif %}
