(function () {
	var $options = $('.js-delivery-opt');

	$options.on('change', function () {
		const isYes = $options.filter(':checked').val() === 'true';

		$('.js-delivery-details input:not([name=delivery_line2])').prop('required', isYes);
		$('.js-delivery-details').toggleClass('hidden-js', !isYes);
	});

	$options.trigger('change');
})();
