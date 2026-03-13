import type { SourceRef } from "../demoData";

/** Topics where data goes stale faster (24-month threshold). */
const FAST_DECAY_PATTERNS = [
  /\bai\b/i,
  /artificial.?intelligence/i,
  /\bsaas\b/i,
  /\bmarket.?size\b/i,
  /\bllm\b/i,
  /\bgenerative\b/i,
];

const FAST_DECAY_MONTHS = 24;
const DEFAULT_DECAY_MONTHS = 36;

export interface FreshnessAssessment {
  isFresh: boolean;
  ageMonths: number | null;
  warning?: string;
}

/**
 * Determine the freshness threshold (in months) for a given topic.
 */
function thresholdForTopic(topic: string): number {
  const isFastDecay = FAST_DECAY_PATTERNS.some((re) => re.test(topic));
  return isFastDecay ? FAST_DECAY_MONTHS : DEFAULT_DECAY_MONTHS;
}

/**
 * Calculate the age of a source in whole months relative to a reference date.
 */
function monthsBetween(earlier: Date, later: Date): number {
  return (
    (later.getFullYear() - earlier.getFullYear()) * 12 +
    (later.getMonth() - earlier.getMonth())
  );
}

/**
 * Assess whether a SourceRef is fresh enough for the given topic domain.
 *
 * @param source  - The source to evaluate.
 * @param topic   - The theme / topic string used to pick the threshold.
 * @param asOf    - Optional reference date (defaults to now).
 */
export function assessFreshness(
  source: SourceRef,
  topic: string,
  asOf: Date = new Date(),
): FreshnessAssessment {
  if (!source.publishedAt) {
    return {
      isFresh: false,
      ageMonths: null,
      warning: `Source "${source.title}" has no published date — freshness unknown.`,
    };
  }

  const publishedDate = new Date(source.publishedAt);
  const ageMonths = monthsBetween(publishedDate, asOf);
  const threshold = thresholdForTopic(topic);

  const assessment: FreshnessAssessment = {
    isFresh: ageMonths <= threshold,
    ageMonths,
  };

  if (!assessment.isFresh) {
    assessment.warning =
      `Source "${source.title}" is ${ageMonths} months old (threshold: ${threshold} months for this topic).`;
  }

  return assessment;
}
