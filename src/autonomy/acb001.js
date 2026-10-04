const COMPONENTS = [
  ["deterministicIdentity", 20],
  ["queueOrdering", 15],
  ["queueImmutability", 15],
  ["inputValidation", 15],
  ["evidenceHonesty", 20],
  ["statusModel", 15],
];

export function scoreAcb001Foundation(results) {
  const components = COMPONENTS.map(([name, weight]) => ({
    name,
    weight,
    passed: results[name] === true,
    awarded: results[name] === true ? weight : 0,
  }));

  const score = components.reduce((sum, component) => sum + component.awarded, 0);

  return {
    benchmark: "ACB-001-foundation",
    score,
    maxScore: 100,
    components,
    verified: false,
  };
}

export { COMPONENTS };