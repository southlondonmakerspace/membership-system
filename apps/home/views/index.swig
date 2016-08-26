{% extends '../../../src/views/base.swig' %}

{% block navbar %}
	<div class="jumbotron">
		<h1>Welcome...</h1>
		<p>
			South London Makerspace is a social community workshop.
		</p>
		<p>
			<a href="http://southlondonmakerspace.org/about" target="_blank" class="btn btn-lg btn-primary">Find out more</a>
		</p>
		<div class="bg"></div>
	</div>
{% endblock %}

{% block content %}
	<div class="row">
		<div class="col-md-6">
			<div class="page-header">
				<h2>Join</h2>
			</div>
			<p>
				<a href="/join" class=" btn btn-primary btn-block btn-lg">Join Now</a>
			</p>
		</div>
		<div class="col-md-6">
			<div class="page-header">
				<h2>Login</h2>
			</div>
			{% include '../../login/views/partials/form.swig' %}
		</div>
	</div>
{% endblock %}
