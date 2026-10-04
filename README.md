# Précis

Fiches brèves sur quelques objets du vivant, composées dans la facture d’un
précis de médecine du début du XXe siècle : papier crème, encre brune,
rubriques au rouge, caractères didones pour les titres et elzéviriens pour le
texte.

**→ https://ksahli.github.io/precis/**

| Chapitre | |
|---|---|
| [La mitochondrie](mitochondrie.html) | Structure, chimiosmose, génome propre — avec une planche en relief interactive |

## Composition

| Fichier | Rôle |
|---|---|
| `index.html` | Page de titre et table des matières |
| `mitochondrie.html` | Le chapitre premier |
| `src/precis.css` | Source Tailwind : thème (encres, caractères) et composants (lettrine, filets ornés, capitales espacées) |
| `assets/precis.css` | **Construit** — ne pas éditer à la main |
| `assets/mitochondrie-3d.js` | La planche en relief |

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

## La planche en relief

Rendue avec [Three.js](https://threejs.org) (r128 épinglé, avec empreinte SRI).
Les contrôles orbitaux sont écrits à la main — une quarantaine de lignes contre
une seconde dépendance au CDN.

Les sept parties sont déclarées dans une seule liste, qui sert à la fois à
construire la géométrie, les textes et la légende HTML : on les parcourt donc
au clavier, sans avoir à viser un pixel dans la scène. La rotation
automatique se tait si `prefers-reduced-motion` est réglé, et un repli textuel
s’affiche à défaut de WebGL.

## Déploiement

Chaque push sur `main` déclenche
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) : il construit le
CSS, rassemble `*.html` et `assets/`, puis publie via `actions/deploy-pages`.

Côté GitHub, la source des Pages doit rester réglée sur **GitHub Actions**
(*Settings → Pages → Build and deployment*).

## Licence

MIT — voir [LICENSE](LICENSE).
