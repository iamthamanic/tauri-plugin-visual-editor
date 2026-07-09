/**
 * Idle overhead benchmark stub — issue #17 implements full measurement.
 */
export const BENCH_VERSION = '0.1.0';

export type BenchScenario = 'feature-off' | 'feature-on-disabled' | 'enabled-idle';

export function describeScenarios(): BenchScenario[] {
  return ['feature-off', 'feature-on-disabled', 'enabled-idle'];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Visual Editor idle benchmark (stub)');
  describeScenarios().forEach((s) => console.log(`- ${s}`));
}
