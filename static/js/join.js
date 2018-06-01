(function () {
	$('.js-join-other-amount').prop('checked', false);

	$('.js-join-form').on('change input', function () {
		var amount = $('.js-join-amount:checked', this).val();
		var period = $('.js-join-period:checked', this).val();

		if (!amount) {
			amount = $('.js-join-other-amount-box').val();
		}

		if (amount) {
			$('.js-join-form-more').removeClass('hidden-js');
			$('.js-join-sustain').toggleClass('hidden', amount >= 3);
			$('.js-join-charge').text('£' + (amount * (period === 'annually' ? 12 : 1)));
		} else {
			$('.js-join-charge').text('£?');
		}
	});

	$('.js-join-other-amount-box').on('focus', function () {
		$('.js-join-amount').prop('checked', false);
		$('.js-join-other-amount').prop('checked', true);
	});

	$('.js-join-amount').on('change', function () {
		$('.js-join-other-amount-box').val('');
	});

})();
