{% extends '../../../src/views/email.text.swig' %}

{% block content %}
Hello {{ firstname }},

Someone has requested a password reset email on your account.

To change your password, just click below, and follow the instructions.
{% endblock %}

{% block action %}{% set action = 'Change Password' %}{% set url = reset_url %}{% include '../../../src/views/partials/action.text.swig' %}{% endblock %}
