# Précis — consignes

- **Toutes les figures sont horizontales et plates, en 2D** — planches
  d'anatomie comprises (la mitochondrie est une coupe à plat, couchée). Pas de
  perspective, pas d'isométrie, pas de volumes modelés.
- **Les schémas de molécule sont toujours plats, en 2D.**
  - Exception à l'horizontale : les formes linéaires restent en **projection de
    Fischer verticale** (C1 en haut, groupes à gauche et à droite).
  - Cycles plus larges que hauts (hexagone, pentagone étirés à l'horizontale).
  - Pas de perspective, pas d'arête grasse : une seule épaisseur de trait.
  Les formules sont des SVG statiques écrits dans la page, avec `stroke` et
  `stroke-width` en attributs (pour rester visibles sans la feuille de style).
- La CSS se construit avec `npm run build` (src/precis.css → assets/precis.css) ;
  après un changement de la feuille, incrémenter le `?v=` du lien dans toutes
  les pages.
