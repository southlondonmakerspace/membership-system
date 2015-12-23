{% extends '../../../src/views/base.swig' %}

{% set title = 'Profile' %}
{% set heading = 'Profile' %}

{% block content %}
	<form method="post">
		<p>
			<label for="firstname">First Name:</label> <input type="text" value="{{ user.firstname }}" id="firstname" name="firstname" required />
		</p>

		<p>
			<label for="lastname">Last Name:</label> <input type="text" value="{{ user.lastname }}" id="lastname" name="lastname" required />
		</p>
	
		<p>
			<label for="email">Email:</label> <input type="email" value="{{ user.email }}" id="email" name="email" required />
		</p>

		<p>
			<label for="tag_id">Tag:</label> <input type="text" value="{{ user.tag_id }}" id="tag_id" name="tag_id" />
		</p>

		<p>
			<label for="address">Address:</label><br />
			<textarea rows="5" id="address" name="address" required>{{ user.address }}</textarea>
		</p>

		<p>
			<button>Update</button>
		</p>
	</form>
{% endblock %}