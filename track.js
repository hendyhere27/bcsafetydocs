// Fires a Google Ads / Google tag event when someone gets a free template.
// Only the template slug is sent. The email address is never passed to Google.
// To count these as Google Ads conversions, paste the conversion label from
// Google Ads (the part after AW-18496519512/) into LEAD_LABEL.
(function () {
  var AW = 'AW-18496519512';
  var LEAD_LABEL = '';
  window.bcsdLead = function (product) {
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', 'generate_lead', { product: String(product || '') });
      if (LEAD_LABEL) gtag('event', 'conversion', { send_to: AW + '/' + LEAD_LABEL });
    } catch (e) {}
  };
})();
