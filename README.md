# Précis

Fiches brèves sur quelques objets du vivant, composées dans la facture d’un
précis de médecine du début du XXe siècle : papier crème, encre brune,
rubriques au rouge, caractères didones pour les titres et elzéviriens pour le
texte.

**→ https://ksahli.github.io/precis/**

| Chapitre | |
|---|---|
| [La mitochondrie](mitochondrie.html) | Structure, chimiosmose, génome propre — avec une planche gravée animée |
| [Les glucides](glucides.html) | Oses et osides, aldoses et cétoses — avec un tableau synoptique |
| [La cyclisation des oses](cyclisation.html) | Glucose et fructose, anomères α et β — en formes linéaires et cycliques, couchées |

## Composition

| Fichier | Rôle |
|---|---|
| `index.html` | Page de titre et table des matières |
| `mitochondrie.html` | Le chapitre premier |
| `glucides.html` | Le chapitre deuxième — classification des glucides |
| `cyclisation.html` | Le chapitre troisième — cyclisation des oses |
| `src/precis.css` | Source Tailwind : thème (encres, caractères) et composants (lettrine, filets ornés, capitales espacées) |
| `assets/precis.css` | **Construit** — ne pas éditer à la main |
| `assets/mitochondrie-planche.js` | La planche gravée et son animation |

Le style est bâti avec [Tailwind](https://tailwindcss.com) v4, compilé en une
feuille statique plutôt que chargé depuis le CDN : pas de flash au chargement,
et une seule requête mise en cache.

```sh
npm install
npm run build     # src/precis.css → assets/precis.css
npm run watch     # idem, en continu
```

La feuille construite est versionnée pour qu’`index.html` s’ouvre directement,
sans rien installer ; mais le workflow la reconstruit à chaque publication, si
bien qu’elle ne peut pas dériver de la source.

Le parti pris typographique est délibérément clair : **pas de variante
sombre**. Un livre de 1910 n’en avait pas, et inverser ce papier en ferait un
autre objet.

## La planche gravée

Du SVG calculé par le script, sans aucune dépendance : ni Three.js, ni WebGL,
ni CDN. **Une seule encre** — les régions se distinguent par leur hachure,
comme sur une planche gravée, jamais par une couleur. Le rouge du typographe ne
sert qu’à deux choses : marquer la partie choisie et suivre les protons.

Elle porte **deux figures**, comme il se doit quand une échelle ne suffit pas.
La figure 1 donne l’organite en coupe ; la figure 2 agrandit le morceau de
membrane interne que le cartouche en pointillé désigne, et c’est là seulement
que la machinerie est à une taille lisible.

Le contour de la figure 1 est un superellipse (|x/a|ⁿ + |y/b|ⁿ = 1, n ≈ 3), qui
donne la silhouette en gélule de l’organite. Le même rayon sert ensuite à savoir
si un point tombe dans la matrice : les ribosomes y sont semés par tirage avec
rejet, si bien qu’aucun ne chevauche un repli, un chromosome ou un repère.

La chimiosmose est portée par des **flèches, non par un mouvement** : les
complexes refoulent les protons sous la membrane, ceux-ci gagnent l’ATP
synthase, refluent au travers, et l’ATP paraît dans la matrice. Les électrons
sautent de complexe en complexe dans l’épaisseur même de la membrane, puisque
c’est leur passage qui alimente les pompes. Rien ne bouge : la planche est un
schéma, pas un film.

Les neuf parties sont déclarées dans une seule liste, qui pose à la fois les
repères chiffrés sur la planche et les entrées de la légende : on les parcourt
donc au clavier, sans jamais viser un pixel. Désigner une partie — sur la
planche ou dans la légende — l’allume au rouge du typographe, jusque dans sa
hachure, et éteint le reste.

## Les formules chimiques

Les chapitres II et III portent des formules — formes linéaires et formes
cycliques — écrites en SVG **directement dans la page**, sans script : elles
s’affichent donc même JavaScript coupé. Même parti que la planche gravée : une
seule encre, et le rouge du typographe réservé aux atomes qui réagissent ou qui
en résultent — le carbonyle et l’hydroxyle qui l’attaque, puis l’oxygène du
cycle et l’hydroxyle anomérique.

**Les schémas de molécule sont toujours couchés et plats, en 2D.** Les
chaînes sont horizontales, C1 à gauche, chaque carbone portant un groupe
au-dessus et un au-dessous ; les cycles sont plus larges que hauts. Pas de
perspective, pas d’arête grasse : un seul trait. Ce que la projection de
Fischer place à droite est ici en dessous, si bien que chaque hydroxyle garde
le même côté dans la chaîne et dans le cycle.

La règle vaut pour **toutes les figures**, planches d’anatomie comprises : la
mitochondrie est une coupe à plat, couchée à l’horizontale, sans perspective.

La classification des glucides est un **tableau synoptique** à accolades, fait
d’une simple liste imbriquée : en colonnes sur grand écran, en arbre en retrait
sur un téléphone.

## Déploiement

Chaque push sur `main` déclenche
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) : il construit le
CSS, rassemble `*.html` et `assets/`, puis publie via `actions/deploy-pages`.

Côté GitHub, la source des Pages doit rester réglée sur **GitHub Actions**
(*Settings → Pages → Build and deployment*).

## Licence

MIT — voir [LICENSE](LICENSE).
