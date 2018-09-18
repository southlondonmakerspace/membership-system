(function () {
	var $form = $('.js-join-form');
	var $formMore = $form.find('.js-join-form-more');
	var $sustain = $form.find('.js-join-sustain');
	var $gift3 = $form.find('.js-join-gift-3');
	var $gift5 = $form.find('.js-join-gift-5');
	var $amount = $form.find('.js-join-amount');
	var $otherAmount = $form.find('.js-join-other-amount');
	var $otherAmountBox = $form.find('.js-join-other-amount-box');
	var $period = $form.find('.js-join-period');
	var $charge = $form.find('.js-join-charge');

	$form.on('change input', function () {
		var amount = $amount.filter(':checked').val();
		var period = $period.filter(':checked').val();

		$otherAmountBox.prop('required', amount === undefined);

		if (!amount) {
			amount = $otherAmountBox.val();
		}

		if (amount) {
			$formMore.removeClass('hidden-js');
			$sustain.toggleClass('hidden', amount >= 3);

			$gift3.prop('disabled', amount < 3);
			$gift5.prop('disabled', amount < 5);
			if (amount < 3) $gift3.prop('checked', false);
			if (amount < 5) $gift5.prop('checked', false);

			$charge.text('£' + (amount * (period === 'annually' ? 12 : 1)));
		} else {
			$charge.text('£?');
		}
	});

	$form.on('submit', function () {
		_paq.push(['trackGoal', 2]);
	});

	$otherAmountBox.on('focus', function () {
		$amount.prop('checked', false);
		$otherAmount.prop('checked', true);
		$form.trigger('change');
	});

	$amount.on('change', function () {
		$otherAmountBox.val('');
	});

	$otherAmount.prop('checked', false);
	$form.trigger('change');

})();
