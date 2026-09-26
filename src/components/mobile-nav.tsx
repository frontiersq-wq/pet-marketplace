"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonClass } from "@/components/ui/button";

type NavLink = { href: string; label: string };

/**
 * The only interactive part of the header, so it is the only thing that ships
 * JavaScript. The header itself stays a Server Component.
 */
export function MobileNav({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);

  // Escape to close, and stop the page behind the panel from scrolling.
  // Navigation closes the panel from the links' own onClick, not from an
  // effect on pathname — that would setState during render and cascade.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-white">
          <nav id="mobile-menu" className="flex h-full flex-col gap-1 overflow-y-auto px-4 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-100"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/enquire"
              onClick={close}
              className={buttonClass("accent", "lg", "mt-4 w-full")}
            >
              Enquire now
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
