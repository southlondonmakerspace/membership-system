{% extends '../../../src/views/base.swig' %}

{% set title = 'Tag' %}
{% set heading = 'Tag' %}

{% block content %}
	<form method="post">
		<p>Your membership tag is how you access the space and tools. Once your Direct Debit is setup you can request a tag and enter it's code here.</p>

		<p>
			<label for="tag_id">Tag:</label> <input type="text" value="{{ user.tag_id }}" id="tag_id" name="tag_id" class="form-control" />
		</p>

		<p>
			<button class="btn btn-primary">Update</button>
		</p>
	</form>
{% endblock %}