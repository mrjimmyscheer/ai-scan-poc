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
      // Find the selected option to get its explicit score if available
      const selectedOption = opts.find(opt => normalizeAnswerValue(opt.value) === norm);
      let itemScore;

      if (selectedOption && typeof selectedOption.score === 'number') {
        // If an explicit score is defined, use it. Scale it to 0-100 based on min/max scores available in options.
        const minScore = opts.length ? Math.min(...opts.map((o) => typeof o.score === 'number' ? o.score : Number(o.value))) : 0;
        const maxScore = opts.length ? Math.max(...opts.map((o) => typeof o.score === 'number' ? o.score : Number(o.value))) : 1;
        const scoreDenom = (maxScore - minScore) || 1;
        itemScore = ((selectedOption.score - minScore) / scoreDenom) * 100;
      } else {
        // Fallback to existing linear calculation based on value
        const minVal = opts.length ? Math.min(...opts.map((o) => Number(o.value))) : 0;
        const maxVal = opts.length ? Math.max(...opts.map((o) => Number(o.value))) : 1;
        const valueDenom = (maxVal - minVal) || 1;
        itemScore = ((norm - minVal) / valueDenom) * 100;
      }

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

  let overallWeightedSum = 0;
  let overallWeightTotal = 0;

  for (const d of domainResults) {
    if (d.score !== null) {
      const domainWeight = typeof d.weight === "number" ? d.weight : 1;
      overallWeightedSum += d.score * domainWeight;
      overallWeightTotal += domainWeight;
    }
  }

  const overall = overallWeightTotal ? Math.round(overallWeightedSum / overallWeightTotal) : 0;

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