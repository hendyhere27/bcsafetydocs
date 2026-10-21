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
  // The nine free template pages: after a successful signup, show a short pointer to the
  // COR kit and the gap check inside the form card. On-page only (nothing extra is emailed).
  var FREE_DOCS = ['flha', 'jsa', 'loto', 'hot-work-permit', 'incident-report', 'policy-statement',
    'safe-work-procedure', 'emergency-response', 'confined-space'];
  function showKitCta(product) {
    var msgs = document.querySelectorAll('.free-msg');
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      if (m.textContent.indexOf('Check your inbox') !== 0) continue;
      var box = m.parentNode;
      if (box.querySelector('.kit-cta')) continue;
      var d = document.createElement('div');
      d.className = 'kit-cta';
      d.setAttribute('style', 'margin-top:14px;padding:12px 14px;background:#FFF8DC;border-left:4px solid #F5C400;border-radius:3px;color:#1A1A1A;font-size:0.82rem;line-height:1.55;text-align:left;');
      var src = encodeURIComponent('free-' + product);
      d.innerHTML = '<strong>Going for COR?</strong> The <a href="/cor-kit?src=' + src + '" style="color:#1A5276;font-weight:600;">COR Small-Employer Kit</a> has 18 editable documents mapped to the 13 national COR audit elements: $279 CAD, 14-day refund. Not sure what you are missing? Take the free <a href="/cor-gap-check?src=' + src + '" style="color:#1A5276;font-weight:600;">2-minute gap check</a> first.';
      m.parentNode.insertBefore(d, m.nextSibling);
    }
  }
  window.bcsdLead = function (product) {
    try {
      if (FREE_DOCS.indexOf(String(product || '')) !== -1) showKitCta(String(product));
    } catch (e) {}
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', 'generate_lead', { product: String(product || '') });
      var label = SECONDARY[String(product || '')] || LEAD_LABEL;
      if (label) gtag('event', 'conversion', { send_to: AW + '/' + label });
    } catch (e) {}
  };
})();
