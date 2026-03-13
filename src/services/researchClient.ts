import type { ResearchPacket } from "../demoData";

export interface ResearchPreferences {
  maxSources?: number;
  locale?: string;
  freshnessMonths?: number;
  sourcePreference?: 'recent-only' | 'allow-older' | 'any';
}

/**
 * Return an empty ResearchPacket used as a safe fallback.
 */
function emptyPacket(warning: string): ResearchPacket {
  return {
    summary: "",
    sources: [],
    claims: [],
    warnings: [warning],
  };
}

/**
 * Call the server's `/api/research` endpoint to gather evidence for a theme.
 *
 * @param theme        - The topic to research.
 * @param apiKey       - Gemini API key (forwarded to the server).
 * @param preferences  - Optional tuning knobs sent to the backend.
 * @returns A `ResearchPacket` with sources, claims, and any warnings.
 */
export async function fetchResearch(
  theme: string,
  apiKey: string,
  preferences?: ResearchPreferences,
): Promise<ResearchPacket> {
  try {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, apiKey, preferences }),
    });

    if (!response.ok) {
      return emptyPacket(
        `Research API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data: ResearchPacket = await response.json();
    return data;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    return emptyPacket(`Research API call failed: ${message}`);
  }
}
