# Précis — consignes

- **Les schémas de molécule sont toujours couchés et plats, en 2D.**
  - Chaînes horizontales, C1 à gauche, un groupe au-dessus et un au-dessous de
    chaque carbone ; pas de projection de Fischer verticale. Ce que Fischer met
    à droite va en dessous.
  - Cycles plus larges que hauts (hexagone, pentagone étirés à l'horizontale).
  - Pas de perspective, pas d'arête grasse : une seule épaisseur de trait.
  Les formules sont des SVG statiques écrits dans la page, avec `stroke` et
  `stroke-width` en attributs (pour rester visibles sans la feuille de style).
- La CSS se construit avec `npm run build` (src/precis.css → assets/precis.css) ;
  après un changement de la feuille, incrémenter le `?v=` du lien dans toutes
  les pages.
