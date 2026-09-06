/* =============================================================================
   Citation metrics — shared core.

   One module, two runtimes:
     - the browser (loaded by app.js) for the live fallback
     - Node, via scripts/update-metrics.mjs, for the nightly GitHub Action

   Method, and why it is the honest one:
   OpenAlex author profiles are built by automatic disambiguation, so an author
   page can contain papers by other people with similar names (this one does).
   Rather than trusting the profile totals, we pull the author's candidate works
   and keep ONLY those that match a publication already on this site — by DOI
   first, then by normalised title. Every number shown is therefore derived from
   Samrat's own curated publication list, and h-index / i10 are recomputed from
   that verified subset.
   ============================================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SKDMetrics = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const OPENALEX = 'https://api.openalex.org';
  // OpenAlex asks for a contact address so they can reach you about heavy use.
  // It is a courtesy header, not authentication.
  const MAILTO = 'sdey@missouri.edu';

  /** Pull a DOI out of any publisher URL that embeds one. */
  function doiFromUrl(url) {
    if (!url) return '';
    const m = String(url).match(/(10\.\d{4,9}\/[^\s"'<>&]+)/);
    if (!m) return '';
    return m[1]
      .replace(/[).,;]+$/, '')
      .replace(/\/(full|abs|abstract|pdf|epdf)$/i, '')
      .replace(/\/$/, '')
      .toLowerCase();
  }

  /** nature.com/articles/s41598-022-25539-x  ->  10.1038/s41598-022-25539-x */
  function doiFromNature(url) {
    const m = String(url || '').match(/nature\.com\/articles\/(s\d[\w.-]+)/i);
    return m ? ('10.1038/' + m[1]).toLowerCase() : '';
  }

  function normDoi(doi) {
    return String(doi || '')
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
      .replace(/\/$/, '')
      .toLowerCase();
  }

  /** Aggressive title normalisation so punctuation and case never block a match. */
  function normTitle(t) {
    return String(t || '')
      .toLowerCase()
      .replace(/[‐-―−]/g, '-')   // all the dash variants
      .replace(/[‘’“”]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 90);
  }

  function pubDoi(pub) {
    return normDoi(doiFromUrl(pub.url) || doiFromNature(pub.url));
  }

  /**
   * Match OpenAlex works against the site's own publication list.
   * @returns {{byPub: Object, matched: Array, unmatched: Array}}
   */
  function matchWorks(pubs, works) {
    const byDoi = {};
    const byTitle = {};
    works.forEach((w) => {
      const d = normDoi(w.doi);
      if (d && !byDoi[d]) byDoi[d] = w;
      const t = normTitle(w.title);
      // Prefer the version of record over preprints / author responses when a
      // title appears more than once: keep whichever has more citations.
      if (t && (!byTitle[t] || (w.cited_by_count || 0) > (byTitle[t].cited_by_count || 0))) {
        byTitle[t] = w;
      }
    });

    const byPub = {};
    const matched = [];
    const unmatched = [];

    pubs.forEach((p) => {
      const d = pubDoi(p);
      const byD = d ? byDoi[d] : null;
      const byT = byTitle[normTitle(p.title)];

      // Take whichever record carries more citations. This matters: some links
      // on this site point at a *correction* or a preprint DOI rather than the
      // version of record — e.g. the 2020 SN Compr. Clin. Med. COVID paper,
      // whose correction DOI has 0 citations while the article itself has 21.
      // Matching on DOI alone would silently under-report those.
      let w = byD, how = byD ? 'doi' : '';
      if (byT && (!byD || (byT.cited_by_count || 0) > (byD.cited_by_count || 0))) {
        w = byT;
        how = byD ? 'title-preferred' : 'title';
      }
      if (!w) { unmatched.push(p.id); return; }
      byPub[p.id] = {
        citations: w.cited_by_count || 0,
        year: w.publication_year || p.year,
        doi: normDoi(w.doi),
        countsByYear: (w.counts_by_year || []).map((c) => [c.year, c.cited_by_count]),
        matchedBy: how,
      };
      matched.push(byPub[p.id]);
    });

    return { byPub: byPub, matched: matched, unmatched: unmatched };
  }

  function summarise(byPub) {
    const counts = Object.keys(byPub).map((k) => byPub[k].citations).sort((a, b) => b - a);
    const total = counts.reduce((a, b) => a + b, 0);

    let h = 0;
    for (let i = 0; i < counts.length; i++) if (counts[i] >= i + 1) h = i + 1;
    const i10 = counts.filter((c) => c >= 10).length;

    // Citations received per calendar year, summed across all matched papers.
    const perYear = {};
    Object.keys(byPub).forEach((k) => {
      (byPub[k].countsByYear || []).forEach((row) => {
        perYear[row[0]] = (perYear[row[0]] || 0) + row[1];
      });
    });

    return {
      citations: total,
      hIndex: h,
      i10Index: i10,
      matchedWorks: counts.length,
      maxCitations: counts[0] || 0,
      citationsByYear: Object.keys(perYear)
        .map(Number).sort((a, b) => a - b)
        .map((y) => [y, perYear[y]]),
    };
  }

  /** Fetch every candidate work for an OpenAlex author id. */
  async function fetchWorks(authorId, fetchImpl) {
    const f = fetchImpl || fetch;
    const out = [];
    let cursor = '*';
    for (let guard = 0; guard < 10 && cursor; guard++) {
      const url = OPENALEX + '/works'
        + '?filter=author.id:' + encodeURIComponent(authorId)
        + '&per-page=200&cursor=' + encodeURIComponent(cursor)
        + '&select=doi,title,publication_year,cited_by_count,counts_by_year'
        + '&mailto=' + encodeURIComponent(MAILTO);
      const res = await f(url);
      if (!res.ok) throw new Error('OpenAlex HTTP ' + res.status);
      const json = await res.json();
      out.push.apply(out, json.results || []);
      cursor = (json.meta && json.meta.next_cursor) || null;
      if (!json.results || !json.results.length) break;
    }
    return out;
  }

  /** Full pipeline: works -> matched -> metrics object ready to render or save. */
  async function build(pubs, authorId, fetchImpl) {
    const works = await fetchWorks(authorId, fetchImpl);
    const m = matchWorks(pubs, works);
    const summary = summarise(m.byPub);
    return {
      source: 'OpenAlex',
      sourceUrl: 'https://openalex.org/' + authorId,
      updated: new Date().toISOString(),
      method: 'Matched against this site\'s own publication list by DOI, then by title. '
        + 'h-index and i10-index are computed from the matched set only.',
      totals: {
        publications: pubs.length,
        citations: summary.citations,
        hIndex: summary.hIndex,
        i10Index: summary.i10Index,
        matchedWorks: summary.matchedWorks,
        candidateWorks: works.length,
      },
      citationsByYear: summary.citationsByYear,
      works: m.byPub,
      unmatched: m.unmatched,
    };
  }

  return {
    build: build,
    fetchWorks: fetchWorks,
    matchWorks: matchWorks,
    summarise: summarise,
    doiFromUrl: doiFromUrl,
    normTitle: normTitle,
    pubDoi: pubDoi,
  };
}));
