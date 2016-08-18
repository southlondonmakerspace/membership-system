<html>
	<body>
		<table style="width: 600px; margin: auto; font-family: sans-serif; font-size: 11pt;">
			<tr height="100">
				<td valign="top">
					<img src="{{ config.audience }}/imgs/logo.png" />
				</td>
			</tr>
			<tr>
				<td>{% block content %}{% endblock %}</td>
			</tr>
			{% block action %}{% endblock %}
			<tr>
				<td>
					<p>Thanks</p>
					<p>{{ config.globals.organisation }}</p>
				</td>
			</tr>
		</table>
	</body>
</html>
