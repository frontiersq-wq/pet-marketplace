import { ListingPurpose } from "@/generated/prisma/enums";

// Prisma returns Decimal columns as a Decimal instance, not a number. Typing the
// input structurally keeps this module free of a Prisma runtime import.
type Decimalish = { toString(): string };

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * Money for display. A null price is intentional rather than missing data:
 * adoption listings are free and mating listings are quoted on enquiry.
 */
export function formatPrice(
  price: Decimalish | null | undefined,
  purpose?: ListingPurpose,
): string {
  if (price === null || price === undefined) {
    if (purpose === ListingPurpose.ADOPTION) return "Free to adopt";
    return "Price on request";
  }

  const value = Number(price.toString());
  if (!Number.isFinite(value)) return "Price on request";

  return inr.format(value);
}

/** Ages are stored in months; show them the way people actually say them. */
export function formatAge(ageMonths: number | null | undefined): string | null {
  if (ageMonths === null || ageMonths === undefined || ageMonths < 0) return null;
  if (ageMonths < 1) return "Newborn";
  if (ageMonths < 12) return `${ageMonths} ${ageMonths === 1 ? "month" : "months"}`;

  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  const yearLabel = `${years} ${years === 1 ? "year" : "years"}`;

  return months === 0 ? yearLabel : `${yearLabel} ${months}m`;
}

const PURPOSE_LABELS: Record<ListingPurpose, string> = {
  [ListingPurpose.SALE]: "For sale",
  [ListingPurpose.ADOPTION]: "For adoption",
  [ListingPurpose.MATING]: "For mating",
};

export function formatPurpose(purpose: ListingPurpose): string {
  return PURPOSE_LABELS[purpose];
}

/** DOG -> Dog, INDIAN_PARIAH -> Indian pariah. Used for enum values with no dedicated label. */
export function titleCaseEnum(value: string): string {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
