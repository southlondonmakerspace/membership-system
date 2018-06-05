(function () {
	var $options = $('.js-delivery-opt');

	$options.on('change', function () {
		$('.js-delivery-details').toggleClass('hidden-js', $options.filter(':checked').val() === 'no');
	});

	$options.trigger('change');
})();
