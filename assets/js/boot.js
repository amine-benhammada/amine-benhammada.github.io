/* ============================================================================
   boot.js — Résolution de la langue AVANT le rendu
   Exécuté dans le <head>, en synchrone.
   ========================================================================== */
(function () {
  "use strict";

  var AVAILABLE = ["fr", "en", "ar"]; // 1re = langue par défaut
  var RTL = ["ar"];                   // langues écrites de droite à gauche
  var STORAGE_KEY = "portfolio_lang";

  function isValid(code) {
    return AVAILABLE.indexOf(code) !== -1;
  }

  // (4) Meilleure correspondance avec les langues préférées du navigateur.
  function fromBrowser() {
    var prefs = navigator.languages || [navigator.language || ""];
    for (var i = 0; i < prefs.length; i++) {
      var base = String(prefs[i]).toLowerCase().split("-")[0]; // "en-US" -> "en"
      if (isValid(base)) return base;
    }
    return null;
  }

  function readStorage() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  // Résolution complète, dans l'ordre de priorité.
  function resolve() {
    var fromGet = new URLSearchParams(window.location.search).get("lang");
    if (isValid(fromGet)) return fromGet;

    var saved = readStorage();
    if (isValid(saved)) return saved;

    var browser = fromBrowser();
    if (browser) return browser;

    return AVAILABLE[0];
  }

  var lang = resolve();
  var dir = RTL.indexOf(lang) !== -1 ? "rtl" : "ltr";

  // Applique tout de suite la langue et la direction sur <html>.
  var html = document.documentElement;
  html.setAttribute("lang", lang);
  html.setAttribute("xml:lang", lang);
  html.setAttribute("dir", dir);

  // Partagé avec le contrôleur (controller.js).
  window.PortfolioI18N = {
    AVAILABLE: AVAILABLE,
    RTL: RTL,
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT: AVAILABLE[0],
    isValid: isValid,
    resolve: resolve,
    current: lang
  };
})();
