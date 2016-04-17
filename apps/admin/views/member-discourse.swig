{% extends '../../../src/views/base.swig' %}

{% set title = 'Discourse' %}
{% set heading = 'Discourse' %}

{% block content %}
	<form method="post">
		<p>
			<label for="id">User ID:</label> <input type="text" value="{{ member.discourse.id }}" id="id" name="id" class="form-control" />
		</p>

		<p>
			<label for="email">Email:</label> <input type="text" value="{{ member.discourse.email }}" id="email" name="email" class="form-control" />
		</p>

		<p>
			<label for="activated">Activated:</label> <input type="checkbox" value="{{ member.discourse.activated }}" {% if member.discourse.activated %}checked{% endif %} id="activated" name="activated" class="form-control" />
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}