# Précis — consignes

- **Les schémas de molécule sont toujours plats, en 2D.** Pas de projection de
  Haworth en perspective, pas d'arête grasse ni de cycle aplati pour suggérer
  la profondeur : cycles en polygones réguliers, une seule épaisseur de trait.
  Les formules sont des SVG statiques écrits dans la page, avec `stroke` et
  `stroke-width` en attributs (pour rester visibles sans la feuille de style).
- La CSS se construit avec `npm run build` (src/precis.css → assets/precis.css) ;
  après un changement de la feuille, incrémenter le `?v=` du lien dans toutes
  les pages.
