{% extends '../../../../../src/views/base.swig' %}

{% set title = 'Discourse' %}
{% set heading = 'Discourse' %}

{% block content %}
	<form method="post">
		<p>
			<label for="id">Username:</label> <input type="text" value="{{ member.discourse.username }}" id="username" name="username" class="form-control" />
		</p>

		<p>
			<label for="activated">Activated:</label> <input type="checkbox" value="{{ member.discourse.activated }}" {% if member.discourse.activated %}checked{% endif %} id="activated" name="activated" class="form-control" />
		</p>

		<p>
	<label for="clear">Clear activation code:</label> <input type="checkbox" id="clear" name="clear" class="form-control" />
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}
