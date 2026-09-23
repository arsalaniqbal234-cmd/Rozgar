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

export type JobCategoryInput = { category?: string | null; tags?: readonly string[] | null; title?: string | null };

// Match role/department phrases before broad technical skills. Word boundaries prevent
// "ui" matching "recruiter" and "HR" matching unrelated words.
const categoryPatterns: readonly [JobPreviewCategory, RegExp][] = [
  ["marketing", /\b(marketing|market research|go[ -]to[ -]market|gtm|pricing strategist|seo|content|brand|growth|campaign|social media|communications?)\b/i],
  ["security", /\b(security|cyber\w*|infosec|penetration|threat|fraud|soc analyst)\b/i],
  ["healthcare", /\b(health\w*|medical|nurs\w*|clinical|patient|pharma\w*|therap\w*|physician|doctor|dentist)\b/i],
  ["people", /\b(human resources|recruit\w*|talent|people|hr)\b/i],
  ["design", /\b(design\w*|ux|ui|creative|illustrat\w*|art director)\b/i],
  ["sales", /\b(sales|account executive|account manag\w*|business development|revenue|partnership\w*|solutions consultant)\b/i],
  ["finance", /\b(financ\w*|accountant|accounting|payroll|tax|investment|banking|treasury|pricing analyst|actuar\w*)\b/i],
  ["product", /\b(product (manager|owner|lead|director|management)|head of product)\b/i],
  ["support", /\b(support|customer success|customer service|helpdesk)\b/i],
  ["education", /\b(educat\w*|teach\w*|instructor|curriculum|learning|professor|tutor)\b/i],
  ["legal", /\b(legal|counsel|attorney|compliance|paralegal|lawyer)\b/i],
  ["logistics", /\b(logistic\w*|supply chain|shipping|warehouse|fleet|procurement)\b/i],
  ["data", /\b(data|analytic\w*|machine learning|ml|artificial intelligence|ai|business intelligence|scientist|research scientist)\b/i],
  ["engineering", /\b(engineer\w*|develop\w*|software|frontend|backend|full[ -]?stack|devops|sre|architect|programmer|cloud|platform|qa|quality assurance)\b/i],
  ["operations", /\b(operat\w*|project manag\w*|program manag\w*|chief of staff|business strategy|strategist|administrat\w*)\b/i],
];

function specificCategory(value?: string | null): JobPreviewCategory | undefined {
  if (!value) return;
  const normalized = value.trim().toLowerCase().replace(/[\s&/_-]+/g, "");
  // "general" is missing information, not an instruction to ignore a useful title.
  if (normalized !== "general" && Object.prototype.hasOwnProperty.call(CATEGORY_IMAGE_SETS, normalized)) return normalized as JobPreviewCategory;
  // A clearly named software role stays Engineering even when its team is Marketing.
  if (/\b(software|frontend|backend|full[ -]?stack|build|hardware|mechanical|electrical)\s+(engineer\w*|develop\w*)\b/i.test(value)) return "engineering";
  return categoryPatterns.find(([, pattern]) => pattern.test(value))?.[0];
}

export function resolveJobCategory(job: JobCategoryInput): JobPreviewCategory {
  // Specific supplied departments remain authoritative. Unhelpful placeholders
  // (General / Other / Uncategorised) must not short-circuit title inference.
  return specificCategory(job.category)
    ?? job.tags?.map(specificCategory).find(Boolean)
    ?? specificCategory(job.title)
    ?? "general";
}

export function imagesForCategory(category?: string | null) {
  return CATEGORY_IMAGE_SETS[resolveJobCategory({ category })];
}

export function motionForCategory(category?: string | null) {
  return CATEGORY_MOTION_PREVIEWS[resolveJobCategory({ category })];
}
