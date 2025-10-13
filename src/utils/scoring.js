export function computeDomainScores(domains, answers) {
  const domainResults = domains.map((d) => {
    const questions = d.questions || [];
    let total = 0;
    let count = 0;

    for (const q of questions) {
      const answerKey = answers[q.id];

      if (answerKey === undefined || answerKey === null) continue;

      const opt = q.options.find((o) => o.value === Number(answerKey));
      if (!opt) continue;

      const index = q.options.findIndex((o) => o === opt);
      const score = (index / (q.options.length - 1)) * 100;

      total += score;
      count++;
    }

    const avg = count > 0 ? total / count : 0;
    return { id: d.id, title: d.title, score: Math.round(avg) };
  });

  const overall = domainResults.length
    ? Math.round(domainResults.reduce((s, d) => s + d.score, 0) / domainResults.length)
    : 0;

  let level = "Novice";
  if (overall >= 80) level = "Advanced";
  else if (overall >= 60) level = "Proficient";
  else if (overall >= 40) level = "Intermediate";

  console.log("Answers:", answers);
  console.log("DomainResults:", domainResults);
  console.log("Overall:", overall, "Level:", level);

  return { overall, level, domains: domainResults };
}