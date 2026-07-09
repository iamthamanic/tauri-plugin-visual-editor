/**
 * Idle overhead benchmark CLI — records and checks PRD targets.
 * Location: bench/idle-overhead.ts
 *
 * Run against examples/react-vite (`npm run tauri:dev`), then open /bench.html.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BENCH_VERSION = '0.1.0';

export type BenchScenario = 'feature-off' | 'feature-on-disabled' | 'enabled-idle';

export const TARGETS = {
  cpuPercent: 0.05,
  heapKb: 100,
} as const;

export type BenchSample = {
  scenario: BenchScenario;
  heapKb: number;
  cpuPercent?: number;
  note?: string;
  recordedAt: string;
};

export type BenchReport = {
  version: string;
  host: 'examples/react-vite';
  samples: BenchSample[];
};

const SCENARIOS: BenchScenario[] = ['feature-off', 'feature-on-disabled', 'enabled-idle'];

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = resolve(__dirname, 'results.json');

export function describeScenarios(): BenchScenario[] {
  return [...SCENARIOS];
}

function loadReport(): BenchReport {
  if (!existsSync(RESULTS_PATH)) {
    return { version: BENCH_VERSION, host: 'examples/react-vite', samples: [] };
  }
  return JSON.parse(readFileSync(RESULTS_PATH, 'utf8')) as BenchReport;
}

function saveReport(report: BenchReport): void {
  mkdirSync(dirname(RESULTS_PATH), { recursive: true });
  writeFileSync(RESULTS_PATH, JSON.stringify(report, null, 2));
}

function printPlan(): void {
  console.log('Visual Editor idle benchmark');
  console.log(`Targets (documented, not CI): <${TARGETS.cpuPercent}% CPU, <${TARGETS.heapKb}KB heap\n`);
  console.log('Host: examples/react-vite (npm run tauri:dev)\n');
  SCENARIOS.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario}`);
    if (scenario === 'feature-off') {
      console.log('   Build host without visual-inspector feature (see bench/README.md).');
    } else if (scenario === 'feature-on-disabled') {
      console.log('   Open /bench.html — plugin loaded, inspector disabled.');
    } else {
      console.log('   Open /bench.html — inspector enabled, idle 3s, sample heap.');
    }
  });
  console.log('\nRecord samples: npx tsx bench/idle-overhead.ts record <scenario> <heapKb> [cpuPercent]');
  console.log('Report:         npx tsx bench/idle-overhead.ts report');
}

function recordSample(scenario: BenchScenario, heapKb: number, cpuPercent?: number, note?: string): void {
  const report = loadReport();
  report.samples = report.samples.filter((s) => s.scenario !== scenario);
  report.samples.push({
    scenario,
    heapKb,
    cpuPercent,
    note,
    recordedAt: new Date().toISOString(),
  });
  saveReport(report);
  console.log(`Recorded ${scenario}: heap=${heapKb}KB${cpuPercent != null ? ` cpu=${cpuPercent}%` : ''}`);
}

function printReport(): void {
  const report = loadReport();
  if (report.samples.length === 0) {
    console.log('No samples yet. Run `npx tsx bench/idle-overhead.ts plan` for instructions.');
    return;
  }
  console.log(`Benchmark report (host: ${report.host})\n`);
  for (const scenario of SCENARIOS) {
    const sample = report.samples.find((s) => s.scenario === scenario);
    if (!sample) {
      console.log(`- ${scenario}: (missing)`);
      continue;
    }
    const heapOk = sample.heapKb < TARGETS.heapKb;
    const cpuOk = sample.cpuPercent == null || sample.cpuPercent < TARGETS.cpuPercent;
    const status = heapOk && cpuOk ? 'PASS' : 'REVIEW';
    console.log(
      `- ${scenario}: heap=${sample.heapKb}KB${sample.cpuPercent != null ? ` cpu=${sample.cpuPercent}%` : ''} [${status}]`,
    );
    if (sample.note) {
      console.log(`    note: ${sample.note}`);
    }
  }
  console.log(`\nTargets: <${TARGETS.heapKb}KB heap, <${TARGETS.cpuPercent}% CPU (documented, not CI-gated)`);
}

function main(): void {
  const [, , command, arg1, arg2, arg3] = process.argv;

  switch (command) {
    case 'plan':
      printPlan();
      break;
    case 'record': {
      const scenario = arg1 as BenchScenario;
      const heapKb = Number(arg2);
      const cpuPercent = arg3 != null ? Number(arg3) : undefined;
      if (!SCENARIOS.includes(scenario) || Number.isNaN(heapKb)) {
        console.error('Usage: record <feature-off|feature-on-disabled|enabled-idle> <heapKb> [cpuPercent]');
        process.exit(1);
      }
      recordSample(scenario, heapKb, cpuPercent);
      break;
    }
    case 'report':
      printReport();
      break;
    default:
      printPlan();
  }
}

main();
