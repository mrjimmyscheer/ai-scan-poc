function normalizeAnswerValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "number") return Number(val);
  const n = Number(val);
  if (!Number.isNaN(n)) return n;
  return null;
}

export function computeDomainScores(domains, answers = {}, options = {}) {
  const domainResults = [];

  for (const d of domains) {
    const questions = d.questions || [];

    let weightedSum = 0;
    let weightTotal = 0;
    const items = [];

    for (const q of questions) {
      if ((q.id && q.id === "QID53") || (q.text && /je akkoord met het gebruik van je gegevens voor onderzoek naar AI-maturiteit in het/i.test(q.text))) {
        const raw = answers[q.id];
        items.push({
          id: q.id,
          text: q.text,
          rawAnswer: raw,
          itemScore: null,
          weight: 0,
          explain: q.explain || ""
        });
        continue;
      }

      const raw = answers[q.id];
      const norm = normalizeAnswerValue(raw);
      const weight = typeof q.weight === "number" ? q.weight : 1;

      if (norm === null) {
        items.push({
          id: q.id,
          text: q.text,
          rawAnswer: raw,
          itemScore: null,
          weight,
          explain: q.explain || ""
        });
        continue;
      }

      const opts = Array.isArray(q.options) ? q.options : [];
      const minVal = opts.length ? Math.min(...opts.map((o) => Number(o.value))) : 0;
      const maxVal = opts.length ? Math.max(...opts.map((o) => Number(o.value))) : 1;
      const clamped = Math.min(maxVal, Math.max(minVal, Number(norm)));

      const denom = (maxVal - minVal) || 1;
      const itemScore = ((clamped - minVal) / denom) * 100;

      weightedSum += itemScore * weight;
      weightTotal += weight;

      items.push({
        id: q.id,
        text: q.text,
        rawAnswer: raw,
        itemScore: Math.round(itemScore),
        weight,
        explain: q.explain || ""
      });
    }

    const domainScore = weightTotal ? Math.round(weightedSum / weightTotal) : null;
    domainResults.push({
      id: d.id,
      title: d.title,
      score: domainScore,
      items
    });
  }

  const validDomainScores = domainResults.map((d) => d.score).filter((s) => s !== null);
  const overall = validDomainScores.length
    ? Math.round(validDomainScores.reduce((a, b) => a + b, 0) / validDomainScores.length)
    : 0;

  let level = "Novice";
  if (overall >= 80) level = "Advanced";
  else if (overall >= 60) level = "Proficient";
  else if (overall >= 40) level = "Intermediate";

  const result = { overall, level, domains: domainResults };

  if (options.exportCsv) {
    result.csv = generateCsv(domainResults, overall, level);
  }

  result.heatmap = generateHeatmap(domainResults);

  return result;
}

export function generateCsv(domainResults, overall, level) {
  const rows = [];
  rows.push(["Domain","Question ID","Question text","Answer","Item score (0-100)","Weight"].join(";"));
  for (const d of domainResults) {
    for (const it of d.items || []) {
      rows.push([
        d.title || "",
        it.id || "",
        (it.text || "").replace(/\n/g, " "),
        String(it.rawAnswer || ""),
        it.itemScore === null ? "" : String(it.itemScore),
        String(it.weight || "")
      ].join(";"));
    }
  }
  return rows.join("\n");
}

export function generateHeatmap(domainResults) {
  const all = [];
  for (const d of domainResults) {
    for (const it of d.items || []) {
      all.push({
        domainId: d.id,
        domainTitle: d.title,
        id: it.id,
        text: it.text,
        score: it.itemScore,
        weight: it.weight,
        explain: it.explain
      });
    }
  }
  all.sort((a, b) => {
    const as = a.score === null ? -1 : a.score;
    const bs = b.score === null ? -1 : b.score;
    return as - bs;
  });
  return all;
}