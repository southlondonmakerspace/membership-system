{% extends '../../../src/views/email.text.swig' %}

{% block content %}
Hello {{ firstname }},

Thanks for setting up your {{ config.globals.organisation }} membership account!

Now to confirm your email, just click Activate below, and follow the instructions.
{% endblock %}

{% block action %}{% set action = 'Activate' %}{% set url = activate_url %}{% include '../../../src/views/partials/action.text.swig' %}{% endblock %}
