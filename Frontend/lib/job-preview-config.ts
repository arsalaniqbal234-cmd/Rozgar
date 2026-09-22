/** Curated local UI previews. Add new categories here and generate two SVGs in public/job-previews/ui. */
export const CATEGORY_IMAGE_SETS = {
  engineering: ["/job-previews/ui/engineering-1.svg", "/job-previews/ui/engineering-2.svg"],
  design: ["/job-previews/ui/design-1.svg", "/job-previews/ui/design-2.svg"],
  sales: ["/job-previews/ui/sales-1.svg", "/job-previews/ui/sales-2.svg"],
  marketing: ["/job-previews/ui/marketing-1.svg", "/job-previews/ui/marketing-2.svg"],
  healthcare: ["/job-previews/ui/healthcare-1.svg", "/job-previews/ui/healthcare-2.svg"],
  data: ["/job-previews/ui/data-1.svg", "/job-previews/ui/data-2.svg"],
  finance: ["/job-previews/ui/finance-1.svg", "/job-previews/ui/finance-2.svg"],
  product: ["/job-previews/ui/product-1.svg", "/job-previews/ui/product-2.svg"],
  operations: ["/job-previews/ui/operations-1.svg", "/job-previews/ui/operations-2.svg"],
  support: ["/job-previews/ui/support-1.svg", "/job-previews/ui/support-2.svg"],
  people: ["/job-previews/ui/people-1.svg", "/job-previews/ui/people-2.svg"],
  education: ["/job-previews/ui/education-1.svg", "/job-previews/ui/education-2.svg"],
  legal: ["/job-previews/ui/legal-1.svg", "/job-previews/ui/legal-2.svg"],
  security: ["/job-previews/ui/security-1.svg", "/job-previews/ui/security-2.svg"],
  logistics: ["/job-previews/ui/logistics-1.svg", "/job-previews/ui/logistics-2.svg"],
  general: ["/job-previews/ui/general-1.svg", "/job-previews/ui/general-2.svg"],
} as const;

export type JobPreviewCategory = keyof typeof CATEGORY_IMAGE_SETS;

/** Local motion assets share the same category keys as the static preview library. */
export const CATEGORY_MOTION_PREVIEWS: Record<JobPreviewCategory, string> = {
  engineering: "/job-previews/motion/engineering.svg",
  design: "/job-previews/motion/design.svg",
  sales: "/job-previews/motion/sales.svg",
  marketing: "/job-previews/motion/marketing.svg",
  healthcare: "/job-previews/motion/healthcare.svg",
  data: "/job-previews/motion/data.svg",
  finance: "/job-previews/motion/finance.svg",
  product: "/job-previews/motion/product.svg",
  operations: "/job-previews/motion/operations.svg",
  support: "/job-previews/motion/support.svg",
  people: "/job-previews/motion/people.svg",
  education: "/job-previews/motion/education.svg",
  legal: "/job-previews/motion/legal.svg",
  security: "/job-previews/motion/security.svg",
  logistics: "/job-previews/motion/logistics.svg",
  general: "/job-previews/motion/general.svg",
};

const categoryPatterns: readonly [JobPreviewCategory, RegExp][] = [
  ["security", /security|cyber|infosec|penetration|threat|fraud|soc analyst/i],
  ["healthcare", /health|medical|nurs|clinical|patient|pharma|therap|physician/i],
  ["data", /data|analytic|machine learning|\bml\b|artificial intelligence|\bai\b|business intelligence|scientist/i],
  ["design", /design|ux|ui|creative|illustrat|art director/i],
  ["sales", /sales|account executive|account management|business development|revenue|partnership/i],
  ["marketing", /market|seo|content|brand|growth|campaign|social media/i],
  ["finance", /financ|accountant|payroll|tax|investment|banking|treasury/i],
  ["product", /product manager|product owner|product lead/i],
  ["support", /support|customer success|customer service|helpdesk/i],
  ["people", /human resources|recruit|talent|people ops|\bhr\b/i],
  ["education", /educat|teach|instructor|curriculum|learning/i],
  ["legal", /legal|counsel|attorney|compliance|paralegal/i],
  ["logistics", /logistic|supply chain|shipping|warehouse|fleet/i],
  ["operations", /operat|project manager|program manager|chief of staff/i],
  ["engineering", /engineer|develop|software|frontend|backend|full.stack|devops|sre|architect|programmer|cloud|platform/i],
];

export function resolveJobCategory(job: { category?: string | null; tags?: readonly string[] | null; title?: string | null }): JobPreviewCategory {
  for (const value of [job.category, ...(job.tags ?? []), job.title]) {
    if (!value) continue;
    const normalized = value.trim().toLowerCase().replace(/[\s&/-]+/g, "");
    if (normalized in CATEGORY_IMAGE_SETS) return normalized as JobPreviewCategory;
    const match = categoryPatterns.find(([, pattern]) => pattern.test(value));
    if (match) return match[0];
  }
  return "general";
}

export function imagesForCategory(category?: string | null) {
  return CATEGORY_IMAGE_SETS[resolveJobCategory({ category })];
}

export function motionForCategory(category?: string | null) {
  return CATEGORY_MOTION_PREVIEWS[resolveJobCategory({ category })];
}
