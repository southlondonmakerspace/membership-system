/* global $ */

// TODO: Copied from join.js, use imports
(function () {
	var $form = $('.js-referral-form');
	var $gift = $form.find('.js-gift');
	var $giftDetails = $form.find('.js-gift-details');
	var $jtjImg = $('.js-jtj-mug-img');
	var $jtjMugOptionValue = $('.js-jtj-mug-option-value');

	$form.on('change input', function () {
		var gift = $gift.filter(':checked').val();
		$giftDetails.each(function () {
			var $this = $(this);
			var isActive = $this.data('id') === gift;
			$this.toggleClass('hidden', !isActive);
			$this.find('input').prop('disabled', !isActive).prop('required', isActive);
		});
	});

	$jtjMugOptionValue.on('change input', function () {
		$jtjImg.attr('src', $jtjMugOptionValue.filter(':checked').data('img'));
	});
})();
