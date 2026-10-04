# precis

Page statique, en construction.

**→ https://ksahli.github.io/precis/**

Deux fichiers, aucune dépendance et aucun JavaScript : `index.html` et
`assets/styles.css`.

## En local

Ouvrir `index.html` directement, ou servir le dossier :

```sh
python3 -m http.server 8000   # puis http://localhost:8000
```

## Déploiement

Chaque push sur `main` déclenche
[`.github/workflows/pages.yml`](.github/workflows/pages.yml), qui publie
`index.html` et `assets/` via `actions/deploy-pages`.

Côté GitHub, la source des Pages doit rester réglée sur **GitHub Actions**
(*Settings → Pages → Build and deployment*).

## Licence

MIT — voir [LICENSE](LICENSE).
