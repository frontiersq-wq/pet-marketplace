import Link from "next/link";

import { Container } from "@/components/ui/container";
import { footerNav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-8">
            <p className="text-lg font-semibold tracking-tight">{site.name}</p>
            <p className="mt-2 text-sm text-neutral-600">{site.description}</p>

            <address className="mt-4 space-y-1 text-sm not-italic text-neutral-600">
              <p>{site.address}</p>
              <p>
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-brand-700">
                  {site.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${site.email}`} className="hover:text-brand-700">
                  {site.email}
                </a>
              </p>
            </address>
          </div>

          {Object.entries(footerNav).map(([heading, links]) => (
            <div key={heading}>
              <h2 className="text-sm font-semibold text-neutral-900">{heading}</h2>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neutral-600 hover:text-brand-700"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-neutral-600 hover:text-brand-700">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. {site.tagline}.
          </p>
        </div>
      </Container>
    </footer>
  );
}
