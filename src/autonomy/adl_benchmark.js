export function createBenchmark({ id, command, expected }) {
  if (!id || !command || !expected) throw new TypeError("id, command and expected are required");
  return { id, command, expected, status: "pending", reproducible: true, result: null, verified: false };
}