<form method="post">
	<p>
		<label for="email">Email:</label> <input type="email" value="{{ member.email }}" id="email" name="email" class="form-control" required />
	</p>
	
	<p>
		<label for="firstname">First Name:</label> <input type="text" value="{{ member.firstname }}" id="firstname" name="firstname" class="form-control" required />
	</p>
	
	<p>
		<label for="lastname">Last Name:</label> <input type="text" value="{{ member.lastname }}" id="lastname" name="lastname" class="form-control" required />
	</p>
	
	<p>
		<label for="tag_id">Tag:</label> <input type="text" value="{{ member.tag_id }}" id="tag_id" name="tag_id" class="form-control" />
	</p>
	
	<p>
		<label for="address">Address:</label><br />
		<textarea rows="4" id="address" name="address" class="form-control" required>{{ member.address }}</textarea>
	</p>
	
	<p>
		<button class="btn btn-primary">{{ action }}</button>
	</p>
</form>