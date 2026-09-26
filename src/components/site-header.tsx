import Link from "next/link";

import { MobileNav } from "@/components/mobile-nav";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { mainNav, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <PawIcon />
            <span className="text-lg">{site.name}</span>
          </Link>

          <nav aria-label="Main" className="hidden md:flex md:items-center md:gap-1">
            {mainNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ButtonLink href="/enquire" variant="accent" className="hidden sm:inline-flex">
              Enquire
            </ButtonLink>
            <MobileNav links={mainNav} />
          </div>
        </div>
      </Container>
    </header>
  );
}

function PawIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-brand-600" aria-hidden="true">
      <circle cx="7" cy="8" r="2.2" />
      <circle cx="12" cy="6" r="2.2" />
      <circle cx="17" cy="8" r="2.2" />
      <circle cx="19" cy="13" r="2" />
      <path d="M12 11c2.6 0 5 2.2 5 4.6 0 1.9-1.5 3.1-3.5 3.1-.9 0-1.1-.3-1.5-.3s-.6.3-1.5.3c-2 0-3.5-1.2-3.5-3.1C7 13.2 9.4 11 12 11Z" />
    </svg>
  );
}
