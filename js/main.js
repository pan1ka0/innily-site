// INNILY — © 2026 pan1ka0 (https://github.com/pan1ka0). Все права защищены.
(function () {
  "use strict";
  var LANGS = ["ru", "uz", "en"];
  var APP_READY = true;   // true — когда кабинет app.innily.com опубликован (cabinet/, wrangler deploy)
  var DICT = window.I18N || {};
  var lang = "ru";

  // ---------- язык ----------
  // русский текст — из самой страницы (запоминаем при загрузке)
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var k = el.getAttribute("data-i18n");
    if (!(k in DICT.ru)) DICT.ru[k] = el.textContent.trim();
  });

  function tr(key) {
    return (DICT[lang] && DICT[lang][key]) || DICT.ru[key] || "";
  }

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* без хранилища — не страшно */ } }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function setLang(next, save) {
    lang = LANGS.indexOf(next) >= 0 ? next : "ru";
    document.documentElement.lang = lang;
    document.title = tr("title");
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = tr(el.getAttribute("data-i18n"));
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      el.alt = tr(el.getAttribute("data-i18n-alt"));
    });
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
    showShot(current, true);
    // ссылки на кабинет (app.innily.com) открывают его на том же языке;
    // пока кабинет не опубликован (APP_READY = false) — ведут к форме заявки на этой странице
    document.querySelectorAll("[data-app]").forEach(function (a) {
      a.href = APP_READY ? "https://app.innily.com/" + a.getAttribute("data-app") + "?lang=" + lang : "#contact";
    });
    if (save) store("innlyra_lang", lang);
  }

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang, true); });
  });

  // ---------- меню на телефоне ----------
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  function closeMenu() { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
  burger.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });

  // ---------- скриншоты ----------
  var SHOTS = ["dashboard", "chess_timeline", "chess_cells", "card", "finance", "reports"];
  var current = "dashboard";
  var img = document.getElementById("shotImg");
  var cap = document.getElementById("shotCap");
  var tabs = document.querySelectorAll(".tabs button");

  function showShot(name, instant) {
    current = name;
    var i = SHOTS.indexOf(name);
    tabs.forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.shot === name)); });
    cap.textContent = tr("s.c" + (i + 1));
    var src = "img/" + name + ".webp";
    img.alt = cap.textContent;
    if (img.getAttribute("src") === src) return;
    if (instant) { img.src = src; return; }
    img.style.opacity = "0";
    setTimeout(function () {
      img.onload = function () { img.style.opacity = "1"; };
      img.src = src;
    }, 180);
  }
  tabs.forEach(function (b) { b.addEventListener("click", function () { showShot(b.dataset.shot); }); });
  // стрелки влево/вправо по вкладкам
  document.querySelector(".tabs").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var i = SHOTS.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1);
    i = (i + SHOTS.length) % SHOTS.length;
    showShot(SHOTS[i]);
    tabs[i].focus();
  });
  SHOTS.forEach(function (n) { var p = new Image(); p.src = "img/" + n + ".webp"; }); // заранее

  // крупный просмотр
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  function openLb(src, alt) { lbImg.src = src; lbImg.alt = alt || ""; lb.hidden = false; document.body.style.overflow = "hidden"; }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; }
  document.getElementById("shotOpen").addEventListener("click", function () { openLb(img.src, img.alt); });
  lb.addEventListener("click", closeLb);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  // заявка — только через регистрацию в кабинете (app.innily.com): формы на сайте нет

  // ---------- анимации ----------
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // полоса прогресса прокрутки и «плотная» шапка
  var bar = document.getElementById("progress");
  var top = document.getElementById("top");
  var ticking = false;
  function onScroll() {
    ticking = false;
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")";
    if (top) top.classList.toggle("scrolled", scrollY > 20);
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // партнёры: бегущая строка — вторая копия списка для бесконечной ленты
  var plist = document.getElementById("partnersList");
  if (plist && !calm) {
    Array.prototype.slice.call(plist.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.querySelectorAll("img").forEach(function (im) { im.alt = ""; });
      plist.appendChild(c);
    });
  }

  // счётчики цифр (от 0 до data-to, когда блок виден)
  function countUp(el) {
    var to = +el.getAttribute("data-to") || 0, t0 = null, dur = 1400;
    if (calm) { el.textContent = to; return; }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }

  // появление при прокрутке: по очереди внутри одного ряда
  var groups = [
    [".grid .card", ""], [".offer__item", ""], [".faq details", ""], [".cm__item", ""],
    [".viewer", "reveal--left"], [".phone", "reveal--right"], [".price", "reveal--zoom"], [".head", ""],
    [".split > div", ""], [".reg-box", "reveal--zoom"], [".form", "reveal--right"], [".stat", ""]
  ];
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        en.target.querySelectorAll(".count").forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    groups.forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (el, i) {
        if (el.classList.contains("reveal")) return;
        el.classList.add("reveal");
        if (g[1]) el.classList.add(g[1]);
        el.style.setProperty("--d", (Math.min(i, 6) * 0.08) + "s");
        io.observe(el);
      });
    });
  } else {
    document.querySelectorAll(".count").forEach(countUp);
  }

  // скриншот на первом экране поворачивается за мышью
  var win = document.getElementById("heroWindow");
  var hero = document.querySelector(".hero");
  if (win && hero && !calm && window.matchMedia("(hover: hover) and (min-width: 901px)").matches) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      win.style.setProperty("--ry", (-6 + x * 8).toFixed(2) + "deg");
      win.style.setProperty("--rx", (2 - y * 6).toFixed(2) + "deg");
    });
    hero.addEventListener("mouseleave", function () { win.style.removeProperty("--ry"); win.style.removeProperty("--rx"); });
  }

  // «живые» события поверх скриншота — по очереди, на текущем языке
  var lives = document.querySelectorAll(".live");
  if (lives.length) {
    var li = 0, slot = 0;
    var showLive = function () {
      var el = lives[slot % lives.length];
      el.classList.remove("show");
      setTimeout(function () {
        el.querySelector(".live__text").textContent = tr("live." + (li % 6 + 1));
        el.classList.add("show");
        li++; slot++;
      }, calm ? 0 : 450);
    };
    setTimeout(function () { showLive(); setTimeout(showLive, 900); }, calm ? 0 : 1300);
    if (!calm) setInterval(showLive, 3200);
  }

  // ---------- стартовый язык: ?lang=uz → сохранённый → язык браузера ----------
  var q = (location.search.match(/[?&]lang=(ru|uz|en)/) || [])[1];
  var saved = load("innlyra_lang");
  var nav = (navigator.language || "ru").slice(0, 2).toLowerCase();
  setLang(q || saved || (LANGS.indexOf(nav) >= 0 ? nav : "ru"), !!q);
})();
