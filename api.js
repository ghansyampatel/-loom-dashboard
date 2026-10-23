/* © 2026 Factory Monitor — All rights reserved. बिना अनुमति copy / बेचना मना है.
 * pages के लिए google.script.run की जगह: data Apps Script के .../exec?action=data&k=KEY से आता है
 * (Google वाला banner नहीं आता).
 *
 * Customer link (सबके लिए एक ही site):
 *   https://<site>/?c=gvs&k=KEY                 → customers.json में "gvs" (type emb / loom अपने आप)
 *   https://<site>/?t=loom&s=AKfy...&k=KEY      → list के बिना सीधा deployment ID / exec URL
 * TFO भी उसी app में: customers.json में "tfo": "<TFO script का exec URL>" → नीचे TFO tabs.
 *   TFO script की View_Key अलग हो तो link में &k2=TFOKEY  (न हो तो k ही इस्तेमाल).
 * एक बार खुलने के बाद phone याद रखता है (अगली बार सिर्फ़ https://<site>/ भी चलेगा).
 */
(function () {
  'use strict';
  var ROOT = (function () {                     // api.js जहाँ है वही site का root
    var src = (document.currentScript && document.currentScript.src) || location.href;
    return src.replace(/[^\/]*([?#].*)?$/, '');
  })();
  var SRC = window.FM_SRC || 'main';           // 'tfo' = TFO pages (दूसरी Apps Script)
  var q = new URLSearchParams(location.search);
  var mem = {};
  try { mem = JSON.parse(localStorage.getItem('fmCust') || '{}') || {}; } catch (e) {}

  var c = (q.get('c') || '').trim().toLowerCase();
  var s = (q.get('s') || '').trim();
  var k = (q.get('k') || '').trim();
  var t = (q.get('t') || '').trim().toLowerCase();
  var k2 = (q.get('k2') || '').trim(), ts = (q.get('ts') || '').trim();
  if (c || s) {                                  // नया link → उसी को याद रखो
    mem = { c: c, s: s, k: k, t: t, k2: k2, ts: ts };
    try { localStorage.setItem('fmCust', JSON.stringify(mem)); } catch (e) {}
  } else { c = mem.c || ''; s = mem.s || ''; k = mem.k || ''; t = mem.t || ''; k2 = mem.k2 || ''; ts = mem.ts || ''; }
  var KEY = SRC === 'tfo' ? (k2 || k) : k;

  function toExec(v) {
    v = String(v || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v.replace(/\/(dev|exec)?\/?$/i, '') + '/exec';
    return 'https://script.google.com/macros/s/' + v + '/exec';   // सिर्फ़ ID दिया हो
  }

  function pick(x) {
    var type = String(x.type || '').toLowerCase();
    var tfo = x.tfo || (type === 'tfo' ? x.url : '');
    var main = SRC === 'tfo' ? tfo : x.url;
    if (!main) throw new Error(SRC === 'tfo' ? 'इस customer का TFO link (customers.json में "tfo") नहीं है' : 'URL नहीं है');
    return { url: toExec(main), name: x.name || '', type: type, tfo: toExec(tfo) };
  }
  var urlP = null;
  function getUrl() {
    if (urlP) return urlP;
    if (s) return (urlP = new Promise(function (r) { r(pick({ url: s, type: t || '', tfo: ts })); }));
    if (!c) return (urlP = Promise.reject(new Error('Link अधूरा है — ?c=customer-code नहीं मिला')));
    urlP = fetch(ROOT + 'customers.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('customers.json नहीं मिली'); return r.json(); })
      .then(function (list) {
        var x = list[c];
        if (!x) throw new Error('Customer "' + c + '" list में नहीं है');
        if (typeof x === 'string') x = { url: x };
        if (x.active === false) throw new Error('यह account बंद है — owner से संपर्क करें');
        return pick(x);
      });
    urlP.catch(function () { urlP = null; });
    return urlP;
  }

  function parse(r) {
    if (!r.ok) throw new Error('Server ' + r.status);
    return r.text().then(function (txt) {
      var d;
      try { d = JSON.parse(txt); } catch (e) { throw new Error('Script access "Anyone" नहीं है या URL गलत है'); }
      if (d && d.ok === false) throw new Error(d.error === 'key' ? 'Link की key गलत है' : (d.error || 'Server error'));
      return d;
    });
  }

  function getDashboardData() {
    return getUrl().then(function (cu) {
      var u = cu.url + '?action=data' + (KEY ? '&k=' + encodeURIComponent(KEY) : '') + '&t=' + Date.now();
      return fetch(u, { cache: 'no-store', redirect: 'follow' });
    }).then(parse);
  }

  // Loom: Quality / Next Beam बदलना (Floor page का edit popup)
  function saveLoomEdit(loomId, d, pin) {
    return getUrl().then(function (cu) {
      return fetch(cu.url, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },     // text/plain = CORS preflight नहीं
        body: JSON.stringify({ action: 'edit', k: KEY, loom: loomId, d: d, pin: pin })
      });
    }).then(parse);
  }

  // google.script.run जैसा ही interface — pages में कोई बदलाव नहीं
  var FN = { getDashboardData: getDashboardData, saveLoomEdit: saveLoomEdit };
  function runner(ok, fail) {
    var o = {
      withSuccessHandler: function (f) { return runner(f, fail); },
      withFailureHandler: function (f) { return runner(ok, f); }
    };
    Object.keys(FN).forEach(function (name) {
      o[name] = function () {
        FN[name].apply(null, arguments)
          .then(function (d) { ok && ok(d); })
          .catch(function (e) { fail ? fail(e) : console.error(e); });
      };
    });
    return o;
  }
  window.google = { script: { run: runner(null, null) } };
  window.FM = { root: ROOT, getUrl: getUrl, cust: function () { return { c: c, s: s, k: k, t: t }; },
    qs: function () {                            // अगले page के लिए link का हिस्सा
      var p = new URLSearchParams();
      if (s) { p.set('s', s); if (t) p.set('t', t); if (ts) p.set('ts', ts); } else if (c) p.set('c', c);
      if (k) p.set('k', k);
      if (k2) p.set('k2', k2);
      var x = p.toString(); return x ? '?' + x : '';
    },
    fail: function (e) {
      document.body.innerHTML = '<div style="padding:30px;font:20px/1.6 Arial,sans-serif;color:#fff;background:#000;min-height:100vh">' +
        '<b style="color:#f87171">⚠ ' + e.message + '</b><br><small style="color:#aaa">सही link owner से लें. ' +
        'उदाहरण: ' + ROOT + '?c=code&amp;k=key</small></div>';
    }
  };
})();
