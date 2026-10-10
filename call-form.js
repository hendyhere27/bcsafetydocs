// Posts the "request a call" forms (class "call-form") to /api/call-request.
// No third-party scripts. The honeypot field ("website") must stay empty.
(function () {
  document.querySelectorAll('form.call-form').forEach(function (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = form.querySelector('.call-msg'), btn = form.querySelector('button[type=submit]');
      var f = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
      msg.style.color = '#777'; msg.textContent = '';
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending...';
      try {
        var resp = await fetch('/api/call-request', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: f('name'), email: f('email'), phone: f('phone'), message: f('message'), topic: form.dataset.topic || 'question', source: location.pathname, website: f('website') })
        });
        var data = await resp.json().catch(function () { return {}; });
        if (resp.ok && data.ok) {
          msg.style.color = '#1E8449';
          msg.textContent = 'Got it. Check your inbox for a confirmation; Derek will email you to find a time.';
          form.reset();
        } else {
          msg.style.color = '#C0392B';
          msg.textContent = data.error || 'Something went wrong. Please email info@bcsafetydocs.com.';
        }
      } catch (err) {
        msg.style.color = '#C0392B';
        msg.textContent = 'Network error. Please email info@bcsafetydocs.com.';
      } finally { btn.disabled = false; btn.textContent = label; }
    });
  });
})();
