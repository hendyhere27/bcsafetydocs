// Fires a Google Ads / Google tag event when someone gets a free template.
// Only the template slug is sent. The email address is never passed to Google.
// To count these as Google Ads conversions, paste the conversion label from
// Google Ads (the part after AW-18496519512/) into LEAD_LABEL.
(function () {
  var AW = 'AW-18496519512';
  var LEAD_LABEL = 'MR_8CPCrx5IdENj66fNE';
  // Secondary conversion actions (not used for bidding), one per tool. These slugs
  // fire their own action INSTEAD of the primary "Free template signup" one.
  var SECONDARY = {
    'cor-rebate-calculator': 'TiESCM33sZcdENj66fNE',
    'cor-gap-check': 'UE8rCND3sZcdENj66fNE'
  };
  window.bcsdLead = function (product) {
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', 'generate_lead', { product: String(product || '') });
      var label = SECONDARY[String(product || '')] || LEAD_LABEL;
      if (label) gtag('event', 'conversion', { send_to: AW + '/' + label });
    } catch (e) {}
  };
})();
