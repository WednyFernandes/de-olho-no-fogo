/* i18n do De Olho no Fogo: o site é escrito em português; em outro idioma do navegador, troca os
   textos pelos de /i18n/en.json depois que a página monta (inclusive o que o JS cria depois).
   ?lang=en ou ?lang=pt força e fica guardado; ?i18n=coletar junta em window.__faltam o que não tem tradução.
   Chaves: texto com espaços normalizados e números trocados por {0}, {1}…; blocos com <b>, <a> etc. usam o innerHTML.
   ponytail: tradução por troca no DOM, não por rota. Rotas /en só se for preciso indexar em inglês. */
(function () {
  var P = new URLSearchParams(location.search), q = P.get('lang'), coletar = P.get('i18n') === 'coletar', L;
  try { if (q === 'pt' || q === 'en') localStorage.setItem('doof-lang', q); L = localStorage.getItem('doof-lang'); } catch (e) {}
  if (!L) L = /^pt\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || 'pt') ? 'pt' : 'en';
  if (coletar) L = 'en'; // coletar = inglês + lista do que faltou
  if (L === 'pt') return;

  var de = document.documentElement, D = null, faltam = window.__faltam = new Map(), feitos = new Set();
  var INL = /^(A|B|STRONG|EM|I|SPAN|SMALL|CODE|BR|SUP|SUB|ABBR|MARK|U|S|TIME|KBD)$/;
  var PULA = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|PRE|svg|SVG|MATH)$/;
  var ATR = ['title', 'aria-label', 'placeholder', 'alt'];
  var NUM = /\d+(?:[.,]\d+)*/g;

  function chave(s) { var n = [], k = s.replace(/\s+/g, ' ').trim().replace(NUM, function (m) { n.push(m); return '{' + (n.length - 1) + '}'; }); return [k, n]; }
  // 1.234,5 (pt) vira 1,234.5 (en); anos e inteiros curtos ficam iguais
  function num(m) { return m.replace(/[.,]/g, function (c) { return c === '.' ? ',' : '.'; }); }
  function traduz(s) {
    if (!s || !/[A-Za-zÀ-ú]/.test(s)) return null;
    var c = chave(s);
    if (feitos.has(c[0])) return null; // já é tradução: não traduz de novo (evita laço A→B→C)
    var t = D && Object.prototype.hasOwnProperty.call(D, c[0]) ? D[c[0]] : null;
    if (t == null) { if (coletar && !faltam.has(c[0])) faltam.set(c[0], location.pathname); return null; }
    t = t.replace(/\{(\d+)\}/g, function (_, i) { return c[1][i] != null ? num(c[1][i]) : ''; });
    feitos.add(chave(t)[0]);
    return t;
  }
  function soInline(el) {
    var tem = false;
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1) { if (!INL.test(c.tagName) || PULA.test(c.tagName) || !soInline(c)) return false; tem = true; }
    }
    return tem || el.childElementCount === 0;
  }
  // bloco = texto solto ao lado de <b>, <a>…; um <nav> só de links desce elemento por elemento
  function misto(el) {
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && /[A-Za-zÀ-ú]/.test(c.nodeValue)) return true;
    return false;
  }
  function texto(n) {
    var v = n.nodeValue, t = traduz(v);
    if (t == null) return;
    t = v.match(/^\s*/)[0] + t + v.match(/\s*$/)[0];
    if (t !== v) n.nodeValue = t; // igual: não reescreve, senão o observador entra em laço
  }
  function atributos(el) {
    for (var i = 0; i < ATR.length; i++) { var v = el.getAttribute(ATR[i]), t = v && traduz(v); if (t != null && t !== v) el.setAttribute(ATR[i], t); }
  }
  function passa(raiz) {
    if (raiz.nodeType === 3) { if (raiz.parentNode && !PULA.test(raiz.parentNode.nodeName)) texto(raiz); return; }
    if (raiz.nodeType !== 1 || PULA.test(raiz.nodeName)) return;
    atributos(raiz);
    if (raiz.childElementCount && misto(raiz) && soInline(raiz)) {
      var t = traduz(raiz.innerHTML);
      if (t != null) { if (t !== raiz.innerHTML) raiz.innerHTML = t; return; }
      if (coletar && /[A-Za-zÀ-ú]/.test(raiz.textContent)) return;
    }
    for (var c = raiz.firstChild; c; c = c.nextSibling) passa(c);
  }
  function titulo() { var t = traduz(document.title); if (t != null && t !== document.title) document.title = t; }

  // canvas: legendas de gráfico desenhadas com fillText
  var ft = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (s) {
    var a = Array.prototype.slice.call(arguments), t = D && typeof s === 'string' ? traduz(s) : null;
    if (t != null) a[0] = t;
    return ft.apply(this, a);
  };

  de.lang = 'en'; de.classList.add('i18n-espera');
  var css = document.createElement('style');
  css.textContent = '.i18n-espera body{visibility:hidden}';
  (document.head || de).appendChild(css);
  function mostra() { de.classList.remove('i18n-espera'); }
  setTimeout(mostra, 2500);

  var obs = new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === 'characterData') texto(m.target);
      else if (m.type === 'attributes') atributos(m.target);
      else for (var j = 0; j < m.addedNodes.length; j++) passa(m.addedNodes[j]);
    }
  });
  function liga() {
    titulo(); passa(document.body); mostra();
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATR });
    new MutationObserver(titulo).observe(document.querySelector('title') || de, { childList: true, characterData: true, subtree: true });
  }
  // Páginas do Next: espera a hidratação do React (load + ócio), senão o React acusa diferença e refaz a árvore
  var pronto = new Promise(function (r) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', r); else r(); })
    .then(function () {
      if (!document.querySelector('script[src*="/_next/"]')) return;
      return new Promise(function (r) {
        function ocio() { (window.requestIdleCallback || setTimeout)(r, { timeout: 800 }); }
        if (document.readyState === 'complete') ocio(); else addEventListener('load', ocio);
      });
    });
  Promise.all([fetch('/i18n/en.json').then(function (r) { return r.json(); }), pronto])
    .then(function (v) { D = v[0]; liga(); }, mostra);
})();
