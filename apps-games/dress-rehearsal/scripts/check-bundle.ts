import { formatReport, measureBudgets, violations } from "./budgets";

const report = await measureBudgets();
console.info(formatReport(report));
const bad = violations(report);
for (const item of bad) {
  console.error(`over budget: ${item.what} ${item.actual} > ${item.limit}`);
}
process.exit(bad.length === 0 ? 0 : 1);
