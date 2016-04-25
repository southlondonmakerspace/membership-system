{% extends '../../../src/views/base.swig' %}

{% set title = 'Profile' %}
{% set heading = 'Profile' %}

{% block content %}
	<form method="post">
		<p>
			<label for="email">Email:</label> <input type="email" value="{{ user.email }}" id="email" name="email" class="form-control" required />
		</p>

		<p>
			<label for="firstname">First Name:</label> <input type="text" value="{{ user.firstname }}" id="firstname" name="firstname" class="form-control" required />
		</p>

		<p>
			<label for="lastname">Last Name:</label> <input type="text" value="{{ user.lastname }}" id="lastname" name="lastname" class="form-control" required />
		</p>

		<p>
			<label for="address">Address:</label><br />
			<textarea rows="4" id="address" name="address" class="form-control" required>{{ user.address }}</textarea>
		</p>

		<h3>Emergency Contact</h3>

		<p>
			<label for="emergency_contact_firstname">First Name:</label> <input type="text" value="{{ user.emergency_contact.firstname }}" id="emergency_contact_firstname" name="emergency_contact_firstname" class="form-control" />
		</p>

		<p>
			<label for="emergency_contact_lastname">Last Name:</label> <input type="text" value="{{ user.emergency_contact.lastname }}" id="emergency_contact_lastname" name="emergency_contact_lastname" class="form-control" />
		</p>

		<p>
			<label for="emergency_contact_telephone">Telephone:</label> <input type="tel" value="{{ user.emergency_contact.telephone }}" id="emergency_contact_telephone" name="emergency_contact_telephone" class="form-control" />
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}