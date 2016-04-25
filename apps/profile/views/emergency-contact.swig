{% extends '../../../src/views/base.swig' %}

{% set title = 'Emergency Contact' %}
{% set heading = 'Emergency Contact' %}

{% block content %}
	<form method="post">

		<p>
			<label for="firstname">First Name:</label> <input type="text" value="{{ user.emergency_contact.firstname }}" id="firstname" name="firstname" class="form-control" />
		</p>

		<p>
			<label for="lastname">Last Name:</label> <input type="text" value="{{ user.emergency_contact.lastname }}" id="lastname" name="lastname" class="form-control" />
		</p>

		<p>
			<label for="telephone">Telephone:</label> <input type="tel" value="{{ user.emergency_contact.telephone }}" id="telephone" name="telephone" class="form-control" />
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}