// SQLite has no scalar-list type, so fields that are conceptually arrays or
// objects (Listing.images, Breed.traits, BlogPost.tags, …) are stored as TEXT
// containing JSON. These helpers are the single place that encoding is applied,
// so Phase 4's move to Postgres `String[]` / `jsonb` only has to change here.

/** Parse a JSON-array column. Returns [] for malformed or unexpected data. */
export function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/** Serialise a string array for storage. */
export function serializeStringArray(value: readonly string[]): string {
  return JSON.stringify(value);
}

/** Structured breed attributes, used by the Phase 1 breed comparison tool. */
export type BreedTraits = {
  size?: "SMALL" | "MEDIUM" | "LARGE" | "GIANT";
  lifespanYears?: [number, number];
  weightKg?: [number, number];
  temperament?: string[];
  /** 1 (low) to 5 (high). */
  grooming?: number;
  exercise?: number;
  shedding?: number;
  trainability?: number;
  goodWithKids?: boolean;
  goodWithPets?: boolean;
  apartmentFriendly?: boolean;
};

/** Parse a JSON-object column. Returns {} for malformed or unexpected data. */
export function parseTraits(value: string | null | undefined): BreedTraits {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as BreedTraits;
  } catch {
    return {};
  }
}

/** Serialise breed traits for storage. */
export function serializeTraits(value: BreedTraits): string {
  return JSON.stringify(value);
}
