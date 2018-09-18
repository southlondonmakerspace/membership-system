(function () {
	var $form = $('.js-join-form');
	var $formMore = $form.find('.js-join-form-more');
	var $sustain = $form.find('.js-join-sustain');
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
