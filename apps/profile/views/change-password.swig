{% extends '../../../src/views/base.swig' %}

{% set title = 'Change Password' %}
{% set heading = 'Change Password' %}

{% block content %}
	<form method="post">
		<p>
			<label for="current">Current password:</label> <input type="password" id="current" name="current" class="form-control" required />
		</p>
		
		<p>
			<label for="new">New password:</label> <input type="password" id="new" name="new" class="form-control" required />
		</p>
		
		<p>
			<label for="verify">Verify new password:</label> <input type="password" id="verify" name="verify" class="form-control" required />
		</p>
		
		<p>
			<button class="btn btn-primary">Update Password</button>
		</p>
	</form>
{% endblock %}