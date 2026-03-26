/** Confidence scoring for import data quality */

export interface ConfidenceFactors {
  fieldCompleteness: number; // 0-1: how many required fields are present
  formatValidity: number;    // 0-1: how many values match expected formats
  duplicateRate: number;     // 0-1: inverse of duplicate percentage
  matchRate: number;         // 0-1: how many rows match existing records
}

/** Calculate overall confidence from factors */
export function calculateOverallConfidence(factors: ConfidenceFactors): number {
  const weights = {
    fieldCompleteness: 0.3,
    formatValidity: 0.25,
    duplicateRate: 0.2,
    matchRate: 0.25,
  };

  const score =
    factors.fieldCompleteness * weights.fieldCompleteness +
    factors.formatValidity * weights.formatValidity +
    factors.duplicateRate * weights.duplicateRate +
    factors.matchRate * weights.matchRate;

  return Math.round(score * 100) / 100;
}

/** Classify confidence into severity levels */
export function classifyConfidence(score: number): "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" {
  if (score >= 0.9) return "HIGH";
  if (score >= 0.7) return "MEDIUM";
  if (score >= 0.5) return "LOW";
  return "CRITICAL";
}

/** Determine if import requires approval based on confidence */
export function requiresApproval(score: number, threshold = 0.85): boolean {
  return score < threshold;
}
