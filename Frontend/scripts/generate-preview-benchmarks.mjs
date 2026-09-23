import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTS, engineering, design, healthcare, dashboard, workspace, detail } from "./preview-artwork.mjs";

const output = join(process.cwd(), "public", "job-previews", "benchmarks");
mkdirSync(output, { recursive: true });
for (const [name, make] of Object.entries({ engineering, design, healthcare })) {
  writeFileSync(join(output, `${name}-ui.svg`), make());
}

const categoryOutput = join(process.cwd(), "public", "job-previews", "ui");
mkdirSync(categoryOutput, { recursive: true });
for (const [category, item] of Object.entries(PRODUCTS)) {
  const first = { engineering, design, healthcare }[category]?.() ??
    (item.chart ? dashboard(category, item) : workspace(category, item));
  writeFileSync(join(categoryOutput, `${category}-1.svg`), first);
  writeFileSync(join(categoryOutput, `${category}-2.svg`), detail(category, item));
}
const motionOutput = join(process.cwd(), "public", "job-previews", "motion");
mkdirSync(motionOutput, { recursive: true });
for (const [category, item] of Object.entries(PRODUCTS)) {
  const animated = { engineering, design, healthcare }[category]?.(true) ??
    (item.chart ? dashboard(category, item, true) : workspace(category, item, true));
  writeFileSync(join(motionOutput, `${category}.svg`), animated);
}
console.log(`Generated ${Object.keys(PRODUCTS).length * 2} static previews, 3 approved samples, and ${Object.keys(PRODUCTS).length} motion previews.`);
