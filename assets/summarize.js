/**
 * precis — extractive summarisation, no dependencies.
 *
 * Sentences are scored by the weight of the words they carry (term frequency
 * over the document, damped by sentence length), nudged by where they sit in
 * their paragraph, then selected greedily while penalising overlap with what
 * has already been picked. Nothing is rewritten: every sentence returned is
 * verbatim from the source.
 */
const Precis = (() => {
  const STOPWORDS = new Set(`a about above after again against all am an and any are aren't as at be
    because been before being below between both but by can cannot could couldn't did didn't do does
    doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having
    he her here hers herself him himself his how i if in into is isn't it its itself just let's me more
    most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own
    same shan't she should shouldn't so some such than that the their theirs them themselves then there
    these they this those through to too under until up very was wasn't we were weren't what when where
    which while who whom why with won't would wouldn't you your yours yourself yourselves also however
    thus therefore may might must shall will been upon among within without whether one two many much
    make makes made like get gets got says said according`.split(/\s+/));

  // Sentence enders that are really abbreviations, not full stops.
  // Kept to abbreviations that almost never end a sentence — "etc." and "al." do,
  // so masking them would glue two sentences together.
  const ABBREV = /\b(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|e\.g|i\.e|fig|inc|ltd|co|approx|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\./gi;
  const SENTINEL = '';

  function splitParagraphs(text) {
    return text.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);
  }

  function splitSentences(text) {
    const masked = text
      .replace(ABBREV, m => m.replace('.', SENTINEL))
      .replace(/\b([A-Z])\./g, (_, c) => c + SENTINEL)        // initials: J. R. R.
      .replace(/(\d)\.(\d)/g, (_, a, b) => a + SENTINEL + b);  // decimals: 3.14

    return masked
      .split(/(?<=[.!?…])["'’”)\]]*(?=\s|$)/)
      .map(s => s.replace(new RegExp(SENTINEL, 'g'), '.').replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 1);
  }

  function words(text) {
    return (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []);
  }

  function contentWords(text) {
    return words(text).filter(w => w.length > 2 && !STOPWORDS.has(w));
  }

  /** Term frequencies across the whole document, scaled to a 0–1 peak. */
  function termWeights(sentences) {
    const freq = new Map();
    for (const s of sentences) {
      for (const w of contentWords(s)) freq.set(w, (freq.get(w) || 0) + 1);
    }
    const peak = Math.max(1, ...freq.values());
    const weights = new Map();
    for (const [w, n] of freq) weights.set(w, n / peak);
    return weights;
  }

  /**
   * Parse text into scored sentence records.
   * Each record: { text, index, paragraph, firstInParagraph, tokens, score }
   */
  function analyse(text) {
    const paragraphs = splitParagraphs(text);
    const records = [];

    paragraphs.forEach((para, p) => {
      splitSentences(para).forEach((sentence, i) => {
        records.push({
          text: sentence,
          index: records.length,
          paragraph: p,
          firstInParagraph: i === 0,
          tokens: new Set(contentWords(sentence)),
        });
      });
    });

    const weights = termWeights(records.map(r => r.text));
    const total = records.length || 1;

    for (const r of records) {
      const mass = [...r.tokens].reduce((sum, w) => sum + (weights.get(w) || 0), 0);
      const length = Math.max(1, words(r.text).length);

      // Damp by sqrt(length) so long sentences don't win on bulk alone.
      let score = mass / Math.sqrt(length);

      // Openers carry the thesis more often than the sentences buried after them.
      if (r.firstInParagraph) score *= 1.15;
      if (r.index === 0) score *= 1.25;
      if (r.index / total > 0.9) score *= 1.05; // conclusions

      // Fragments and one-liners rarely stand alone as a summary.
      if (length < 6) score *= 0.4;
      if (length > 60) score *= 0.85;

      r.score = score;
    }

    return { paragraphs, sentences: records, weights };
  }

  function overlap(a, b) {
    if (!a.size || !b.size) return 0;
    let shared = 0;
    for (const t of a) if (b.has(t)) shared++;
    return shared / Math.min(a.size, b.size);
  }

  /** How many sentences a given ratio asks for. */
  function budget(count, ratio) {
    if (!count) return 0;
    return Math.max(1, Math.min(count, Math.round(count * ratio)));
  }

  /**
   * Greedy selection: best remaining score, minus a penalty for repeating
   * ground already covered. Returns sentences in original document order.
   */
  function summary(text, ratio = 0.25) {
    const { sentences } = analyse(text);
    const want = budget(sentences.length, ratio);
    const picked = [];
    const pool = [...sentences];

    while (picked.length < want && pool.length) {
      let bestIdx = 0;
      let bestValue = -Infinity;

      pool.forEach((candidate, i) => {
        const redundancy = picked.reduce(
          (max, chosen) => Math.max(max, overlap(candidate.tokens, chosen.tokens)), 0);
        const value = candidate.score * (1 - 0.7 * redundancy);
        if (value > bestValue) { bestValue = value; bestIdx = i; }
      });

      picked.push(pool.splice(bestIdx, 1)[0]);
    }

    return picked.sort((a, b) => a.index - b.index);
  }

  /** One leading sentence per paragraph, keeping only the strongest paragraphs. */
  function outline(text, ratio = 0.25) {
    const { sentences } = analyse(text);
    const byParagraph = new Map();

    for (const s of sentences) {
      const best = byParagraph.get(s.paragraph);
      if (!best || s.score > best.score) byParagraph.set(s.paragraph, s);
    }

    // An outline is meant to cover the shape of the document, so it keeps a
    // larger share of paragraphs than the summary keeps of sentences.
    const leads = [...byParagraph.values()];
    const want = budget(leads.length, Math.max(ratio * 2.4, 0.34));

    return leads
      .sort((a, b) => b.score - a.score)
      .slice(0, want)
      .sort((a, b) => a.index - b.index);
  }

  /** Top single words and adjacent pairs, by frequency. */
  function terms(text, limit = 14) {
    const tokens = contentWords(text);
    const unigrams = new Map();
    const bigrams = new Map();

    tokens.forEach((w, i) => {
      unigrams.set(w, (unigrams.get(w) || 0) + 1);
      const next = tokens[i + 1];
      if (next) {
        const pair = `${w} ${next}`;
        bigrams.set(pair, (bigrams.get(pair) || 0) + 1);
      }
    });

    const ranked = [
      // A repeated pair is more informative than either word alone.
      ...[...bigrams].filter(([, n]) => n > 1).map(([term, n]) => ({ term, n, weight: n * 2.2 })),
      ...[...unigrams].filter(([, n]) => n > 1).map(([term, n]) => ({ term, n, weight: n })),
    ].sort((a, b) => b.weight - a.weight);

    // Drop single words already shown inside a surviving pair.
    const kept = [];
    for (const item of ranked) {
      const covered = kept.some(k => k.term !== item.term && k.term.includes(item.term));
      if (!covered) kept.push(item);
      if (kept.length >= limit) break;
    }

    // Short texts repeat nothing; fall back to first-appearance order so the
    // panel still says something useful.
    if (kept.length < 3) {
      for (const w of tokens) {
        if (!kept.some(k => k.term.includes(w))) kept.push({ term: w, n: 1, weight: 1 });
        if (kept.length >= Math.min(limit, 8)) break;
      }
    }
    return kept;
  }

  function stats(text) {
    const wordCount = words(text).length;
    return {
      words: wordCount,
      sentences: splitParagraphs(text).reduce((n, p) => n + splitSentences(p).length, 0),
      paragraphs: splitParagraphs(text).length,
      minutes: Math.max(1, Math.round(wordCount / 220)),
    };
  }

  return { analyse, summary, outline, terms, stats, splitSentences, splitParagraphs, words };
})();
