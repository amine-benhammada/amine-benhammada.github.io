# Portfolio multilingue — Ahmed Amine Benhammada

Projet de **Web sémantique** (Sup Galilée) : portfolio personnel disponible en
**français, anglais et arabe**, conforme aux recommandations d'accessibilité et de référencement
multilingue.

🔗 **En ligne :** https://amine-benhammada.github.io/

> Langue non latine choisie : **arabe** (affichage droite‑à‑gauche / RTL).

## Lancer le site en local

Le contenu est chargé depuis un fichier XML via `fetch`. Il faut donc un petit serveur HTTP
(l'ouverture directe en `file://` est bloquée par le navigateur) :

```bash
cd amine-benhammada.github.io
python -m http.server 8000
# puis ouvrir http://localhost:8000/?lang=fr
```

## Architecture

| Fichier | Rôle |
|---|---|
| `index.html` | Page **HTML5 + XHTML valide** (servie en `text/html`), annotée en RDFa + schema.org. Le texte FR y est présent en dur comme **contenu par défaut** (le site reste lisible sans JS). |
| `data/content.xml` | **Source de données** multilingue au format **TMX 1.4** (`<tu>` / `<tuv xml:lang>`). Pour chaque identifiant `tuid` et chaque langue `xml:lang`, on retrouve le contenu. |
| `assets/js/boot.js` | Détermine la langue **avant le rendu** (priorités ci‑dessous) et fixe `lang`/`dir` sur `<html>`. |
| `assets/js/controller.js` | **Contrôleur** : lit et décortique le XML, applique la langue à toute la page, met à jour méta‑données / `hreflang` / vidéo, gère le changement fluide. |
| `assets/css/style.css` | Thème + bouton de langue fixe + support **RTL** (arabe). |

### Pourquoi un contrôleur en JavaScript et non en PHP ?

Le sujet décrit un contrôleur **PHP côté serveur**. Le site est hébergé sur **GitHub Pages**, qui
ne sert que du contenu **statique** (pas de PHP). Le contrôleur est donc écrit en **JavaScript côté
client** : il remplit exactement le même rôle (résolution de la langue + récupération du contenu
dans le XML), tout en restant déployable sur `*.github.io`. La logique de priorité est strictement
celle demandée par le sujet (voir ci‑dessous).

> Une version PHP équivalente (`index.php` avec `$_GET`, `$_POST`, `$_SESSION`, `Accept-Language`)
> peut être fournie sur demande pour une exécution sur un serveur PHP.

## Correspondance avec le sujet

**Détection de la langue — ordre de priorité** (implémenté dans `boot.js` / `controller.js`) :

1. **Paramètre GET** — `?lang=en` lu via `URLSearchParams`.
2. **Clic sur un bouton de langue (≈ POST)** — le bouton est un lien `?lang=xx` ; le clic est
   intercepté et traité en direct, sans rechargement.
3. **Variable de session** — le choix est enregistré dans `localStorage` et réutilisé ensuite.
4. **Langues préférées du navigateur (≈ en‑tête `Accept-Language`)** — `navigator.languages`.
5. **Défaut** — première langue disponible du site (**fr**).

**Autres exigences :**

- **HTML5 + XHTML valide**, servi en `text/html` : balises fermées, `xmlns`, `xml:lang`,
  attributs entre guillemets, éléments vides auto‑fermés.
- **Bouton de langue à position fixe** : en haut de l'écran, avec **drapeau + code ISO**
  (🇫🇷 FR / 🇬🇧 EN / 🇸🇦 ع). Passe à gauche en mode RTL.
- **Liens `<link rel="alternate" hreflang="…">`** dans le `<head>` vers chaque version
  (`fr`, `en`, `ar`, `x-default`) + `canonical` mis à jour selon la langue.
- **Liens vers les autres versions dans le `body`** : ce sont les boutons de langue eux‑mêmes
  (vrais liens `?lang=`).
- **Métadonnées sémantiques** : **RDFa** avec **Dublin Core** (`dc:`) et **FOAF** (`foaf:`),
  plus **schema.org** (attributs `schema:` inline + bloc **JSON‑LD** `Person`). Vocabulaires de
  l'univers LOD.
- **Changement de langue fluide** : on reste sur la même page / la même ancre (pas de rechargement),
  et la navigation ne réinitialise pas la langue (mémorisée).
- **Source de données** : fichier **XML** (TMX 1.4) décortiqué par le contrôleur.
- **Le choix de langue détermine** : le texte, la langue des autres versions (liens body + `head`),
  la langue des méta‑données, et **la version de la vidéo** incorporée (une source YouTube par langue,
  attributs `data-yt-fr/en/ar`).

## Vidéo

La section vidéo intègre une `iframe` YouTube dont la source change selon la langue active.

## Technologies

HTML5 · XHTML · CSS3 · JavaScript (Vanilla) · XML / TMX 1.4 · RDFa · Dublin Core · FOAF · schema.org
