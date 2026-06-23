/* ============================================================================
   controller.js — Contrôleur côté client du portfolio multilingue.
   exécuté côté navigateur pour rester statique et hébergeable sur GitHub Pages
   ========================================================================== */
(function () {
  "use strict";

  var I18N = window.PortfolioI18N;
  var DATA_URL = "data/content.xml";

  // Une locale Open Graph par langue.
  var OG_LOCALE = { fr: "fr_FR", en: "en_US", ar: "ar_AR" };

  var dict = {};        // dict[id][lang] = texte
  var currentLang = I18N ? I18N.current : "fr";

  /* ---------------------------------------------------------------------- */
  /* 1. Lecture + analyse du XML (TMX 1.4)                                   */
  /* ---------------------------------------------------------------------- */
  function loadData() {
    return fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (xmlText) {
        var doc = new DOMParser().parseFromString(xmlText, "application/xml");
        if (doc.getElementsByTagName("parsererror").length) {
          throw new Error("XML invalide");
        }
        var units = doc.getElementsByTagName("tu");
        for (var i = 0; i < units.length; i++) {
          var tu = units[i];
          var id = tu.getAttribute("tuid");
          if (!id) continue;
          dict[id] = {};
          var variants = tu.getElementsByTagName("tuv");
          for (var j = 0; j < variants.length; j++) {
            var tuv = variants[j];
            // xml:lang : selon le parseur, getAttribute("xml:lang") ou ("lang")
            var lg = tuv.getAttribute("xml:lang") || tuv.getAttribute("lang");
            var seg = tuv.getElementsByTagName("seg")[0];
            if (lg && seg) dict[id][lg] = seg.textContent;
          }
        }
      });
  }

  // Récupère le contenu d'un bloc « id » dans la langue « lang ».
  function t(id, lang) {
    if (dict[id] && dict[id][lang] != null) return dict[id][lang];
    if (dict[id] && dict[id][I18N.DEFAULT] != null) return dict[id][I18N.DEFAULT];
    return null; // on garde le texte inline (défaut) si introuvable
  }

  /* ---------------------------------------------------------------------- */
  /* 2. Application de la langue à la page                                   */
  /* ---------------------------------------------------------------------- */
  function applyLanguage(lang) {
    if (!I18N.isValid(lang)) lang = I18N.DEFAULT;
    currentLang = lang;
    var dir = I18N.RTL.indexOf(lang) !== -1 ? "rtl" : "ltr";

    var html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("xml:lang", lang);
    html.setAttribute("dir", dir);

    // Texte des éléments [data-i18n]
    var nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach(function (el) {
      var val = t(el.getAttribute("data-i18n"), lang);
      if (val != null) el.textContent = val;
    });

    // Attributs des éléments [data-i18n-attr="attribut:id[, attribut:id]"]
    var attrNodes = document.querySelectorAll("[data-i18n-attr]");
    attrNodes.forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0] && parts[0].trim();
        var id = parts[1] && parts[1].trim();
        if (!attr || !id) return;
        var val = t(id, lang);
        if (val != null) el.setAttribute(attr, val);
      });
    });

    updateMeta(lang);
    updateLangSwitch(lang);
    updateVideo(lang);
    persist(lang);
    syncUrl(lang);
  }

  // Méta-données dépendantes de la langue.
  function updateMeta(lang) {
    var dcLang = document.getElementById("dc-language");
    if (dcLang) dcLang.setAttribute("content", lang);
    var ogLocale = document.getElementById("og-locale");
    if (ogLocale) ogLocale.setAttribute("content", OG_LOCALE[lang] || lang);

    // canonical pointe vers la version courante
    var canonical = document.getElementById("link-canonical");
    if (canonical) canonical.setAttribute("href", "?lang=" + lang);

    // JSON-LD : on met à jour le jobTitle dans la bonne langue
    var ld = document.getElementById("ld-person");
    if (ld) {
      try {
        var data = JSON.parse(ld.textContent);
        var role = t("role", lang);
        if (role) data.jobTitle = role;
        data.inLanguage = lang;
        ld.textContent = JSON.stringify(data, null, 2);
      } catch (e) { /* on ignore */ }
    }
  }

  // Bouton de langue : marque la langue active.
  function updateLangSwitch(lang) {
    var btns = document.querySelectorAll(".lang-btn");
    btns.forEach(function (b) {
      var active = b.getAttribute("data-lang") === lang;
      b.classList.toggle("is-active", active);
      if (active) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }

  // Vidéo : choisit la source YouTube correspondant à la langue.
  function updateVideo(lang) {
    var frame = document.getElementById("video-frame");
    var iframe = document.getElementById("video-iframe");
    if (!frame || !iframe) return;
    var id = frame.getAttribute("data-yt-" + lang);
    if (!id) return;
    var newSrc = "https://www.youtube-nocookie.com/embed/" + id;
    if (iframe.getAttribute("src") !== newSrc) iframe.setAttribute("src", newSrc);
  }

  // Enregistre le choix (variable de "session" persistante).
  function persist(lang) {
    try { localStorage.setItem(I18N.STORAGE_KEY, lang); } catch (e) {}
  }

  // Reflète la langue dans l'URL (?lang=xx) SANS recharger ni perturber l'ancre.
  function syncUrl(lang) {
    var url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.history.replaceState(null, "", url.toString());
  }

  /* ---------------------------------------------------------------------- */
  /* 3. Changement de langue fluide via les boutons                         */
  /* ---------------------------------------------------------------------- */
  function wireButtons() {
    document.querySelectorAll(".lang-btn").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();                 // pas de rechargement (cas ≈ POST géré en direct)
        var lang = link.getAttribute("data-lang");
        applyLanguage(lang);                // on reste sur la même page / même ancre
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 4. Démarrage                                                            */
  /* ---------------------------------------------------------------------- */
  function start() {
    wireButtons();
    loadData()
      .then(function () { applyLanguage(currentLang); })
      .catch(function (err) {
        // En cas d'échec (ex. ouverture en file:// sans serveur), on conserve
        // le contenu FR inline ; la page reste utilisable.
        console.warn("[portfolio] XML non chargé :", err.message,
          "\nAstuce : ouvrez le site via un serveur local (ex. python -m http.server).");
        updateLangSwitch(currentLang);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
