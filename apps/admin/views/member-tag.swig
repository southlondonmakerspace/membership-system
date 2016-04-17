{% extends '../../../src/views/base.swig' %}

{% set title = 'Tag' %}
{% set heading = 'Tag' %}

{% block content %}
	<form method="post">
		<p>
			<label for="tag">Tag:</label> <input type="text" value="{{ member.tag }}" id="tag" name="tag" class="form-control" />
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}