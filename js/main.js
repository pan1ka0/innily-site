// INNLYRA — © 2026 pan1ka0 (https://github.com/pan1ka0). Все права защищены.
(function () {
  "use strict";
  var FORM_URL = "https://formsubmit.co/ajax/support.innlyra@gmail.com"; // заявки приходят на эту почту
  var LANGS = ["ru", "uz", "en"];
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

  // ---------- кнопки, которые сразу выбирают тему заявки ----------
  var topic = document.querySelector("select[name=topic]");
  document.querySelectorAll("[data-topic]").forEach(function (a) {
    a.addEventListener("click", function () { topic.value = a.dataset.topic; });
  });
  document.querySelectorAll('a[href="#contact"]').forEach(function (a) {
    if (a.dataset.topic) return;
    var key = a.getAttribute("data-i18n");
    if (key === "p.btn") a.addEventListener("click", function () { topic.value = "price"; });
  });

  // ---------- заявка ----------
  var form = document.getElementById("leadForm");
  var btn = document.getElementById("leadBtn");
  var status = document.getElementById("leadStatus");

  function setStatus(text, cls) { status.textContent = text; status.className = "form__status " + (cls || ""); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form._honey.value) return; // бот заполнил скрытое поле
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    form.name.classList.toggle("invalid", !name);
    form.phone.classList.toggle("invalid", phone.replace(/\D/g, "").length < 7);
    if (!name || phone.replace(/\D/g, "").length < 7) { setStatus(tr("form.req"), "err"); return; }

    var topicText = topic.options[topic.selectedIndex].textContent;
    var data = {
      "Имя": name,
      "Телефон": phone,
      "Гостиница": form.hotel.value.trim(),
      "Город": form.city.value.trim(),
      "Номеров": form.rooms.value.trim(),
      "Интересует": topicText,
      "Сообщение": form.message.value.trim(),
      "Язык сайта": lang.toUpperCase(),
      _subject: "INNLYRA: новая заявка — " + topicText + (form.hotel.value.trim() ? " (" + form.hotel.value.trim() + ")" : ""),
      _template: "table",
      _captcha: "false"
    };
    btn.disabled = true;
    setStatus(tr("form.sending"));
    fetch(FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || String(j.success) === "false") throw new Error(j.message || r.status);
      });
    }).then(function () {
      form.reset();
      setStatus(tr("form.ok"), "ok");
    }).catch(function () {
      setStatus(tr("form.err"), "err");
    }).finally(function () {
      btn.disabled = false;
    });
  });

  // ---------- появление блоков при прокрутке ----------
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".card, .offer__item, .faq details, .cm__item, .viewer, .phone, .price")
      .forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }

  // ---------- стартовый язык: ?lang=uz → сохранённый → язык браузера ----------
  var q = (location.search.match(/[?&]lang=(ru|uz|en)/) || [])[1];
  var saved = load("innlyra_lang");
  var nav = (navigator.language || "ru").slice(0, 2).toLowerCase();
  setLang(q || saved || (LANGS.indexOf(nav) >= 0 ? nav : "ru"), !!q);
})();
