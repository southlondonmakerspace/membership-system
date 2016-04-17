{% extends '../../../src/views/base.swig' %}

{% set title = 'Activation' %}
{% set heading = 'Activation' %}
{% set activeApp = 'admin' %}

{% block content %}
	<form method="post">
		<p>
			<label for="activated">Activated:</label> <input type="checkbox" value="{{ member.activated }}" {% if member.activated %}checked{% endif %} id="activated" name="activated" class="form-control" />
		</p>
		
		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}