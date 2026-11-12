export interface CourseScore {
  firstName: string | null;
  lastName: string | null;
  score: number; // relative to par, e.g. -17
  scoreRank: number;
  scoreRankTied: boolean;
  eventDate: string | null; // YYYY-MM-DD
  format: string | null;
  played: number | null; // holes played
  rating?: number | null;
  division?: string | null;
  par?: number | null;
  pdgaProfileUrl?: string | null;
  pdgaEventId?: number | null;
  eventName?: string | null;
  round?: number | null;
  layoutName?: string | null;
}

export interface CourseScoresData {
  generatedAt?: string;
  scores: CourseScore[];
}

// "Singles" -> "singles", "Best Shot Doubles" -> "best-shot-doubles"
export function recordsSlug(format: string): string {
  return format
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Fetched at build time. Returns null if the source is unreachable so the build still succeeds.
export async function fetchCourseScores(url: string): Promise<CourseScoresData | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Course records: ${url} returned ${response.status}`);
      return null;
    }
    const data = await response.json();
    return { ...data, scores: Array.isArray(data.scores) ? data.scores : [] };
  } catch (error) {
    console.warn(`Course records: could not fetch ${url}`, error);
    return null;
  }
}
