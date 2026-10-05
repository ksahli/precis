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
- **Jour et nuit** : aucune couleur en dur. Tout passe par les variables
  `--color-*` (redéfinies pour la nuit dans `src/precis.css`) ou par
  `currentColor`, et chaque page porte le bouton Jour / Nuit et le petit
  script de tête qui applique le choix retenu avant le premier rendu.
- **Chaque chapitre finit par une interrogation** (avant les notes) : huit
  questions à choix multiple tirées du texte même du chapitre, bonne réponse
  marquée `data-juste`, corrigé dans un `<details class="corrige">`, script
  `assets/quiz.js`. Un nouveau chapitre en reçoit une ; un chapitre modifié
  voit ses questions revues.
- La CSS se construit avec `npm run build` (src/precis.css → assets/precis.css) ;
  après un changement de la feuille, incrémenter le `?v=` du lien dans toutes
  les pages.
