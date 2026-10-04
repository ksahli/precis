# precis

A tiny in-browser text summarizer. Paste an article and get back the sentences
that carry it — as a summary, an outline, or the terms it keeps returning to.

**→ https://ksahli.github.io/precis/**

## How it works

`precis` is *extractive*: it ranks the sentences you gave it and shows the best
ones verbatim. Nothing is paraphrased or generated, so it can't invent a claim
the source didn't make.

Each sentence is scored by the weight of the content words it carries (term
frequency across the document, damped by `sqrt(length)` so long sentences don't
win on bulk alone), nudged up if it opens a paragraph or the document, and down
if it's a fragment. Selection is greedy with a redundancy penalty, so the second
sentence picked is the best one that *isn't* restating the first. See
[`assets/summarize.js`](assets/summarize.js).

- **Summary** — top sentences, in original order
- **Outline** — the strongest sentence from each paragraph
- **Key terms** — recurring words and word pairs
- **Length** — the share of sentences to keep (5–60%)

Drop a `.txt` or `.md` file on the page to load it. Your draft is kept in
`localStorage`; nothing is ever sent anywhere.

## Running it

No build step, no dependencies. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Deployment

Pushing to `main` triggers [`.github/workflows/pages.yml`](.github/workflows/pages.yml),
which stages `index.html` + `assets/` and publishes them with
`actions/deploy-pages`.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source:
GitHub Actions**.

## License

MIT — see [LICENSE](LICENSE).
