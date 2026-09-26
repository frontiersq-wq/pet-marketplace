import type { ReactNode } from "react";

/**
 * The single horizontal rhythm for the site. Every full-width section renders a
 * Container inside it, so page edges line up from the header to the footer.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
