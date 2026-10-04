import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import {
  ContentStatus,
  LeadStatus,
  ListingStatus,
} from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { titleCaseEnum } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "bg-amber-50 text-amber-800 border-amber-200",
  [LeadStatus.CONTACTED]: "bg-blue-50 text-blue-800 border-blue-200",
  [LeadStatus.QUALIFIED]: "bg-brand-50 text-brand-800 border-brand-200",
  [LeadStatus.CONVERTED]: "bg-emerald-50 text-emerald-800 border-emerald-200",
  [LeadStatus.LOST]: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const [
    totalLeads,
    newLeads,
    activeListings,
    publishedPosts,
    recentLeads,
    listingsByStatus,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: LeadStatus.NEW } }),
    prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
    prisma.blogPost.count({ where: { status: ContentStatus.PUBLISHED } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        species: true,
        status: true,
        requirement: true,
        createdAt: true,
        source: true,
        city: { select: { name: true } },
        breed: { select: { name: true } },
      },
    }),
    prisma.listing.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const listingStatusMap: Partial<Record<ListingStatus, number>> =
    Object.fromEntries(
      listingsByStatus.map((r) => [r.status, r._count._all]),
    );

  const STATS = [
    { label: "Total leads", value: totalLeads, note: `${newLeads} new` },
    { label: "Active listings", value: activeListings },
    { label: "Published posts", value: publishedPosts },
    {
      label: "Pending review",
      value: listingStatusMap[ListingStatus.PENDING_REVIEW] ?? 0,
    },
  ];

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Signed in as {session.user.email}
          </p>
        </div>
        <form
          action="/api/auth/signout"
          method="post"
        >
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-neutral-200 bg-white p-5"
          >
            <p className="text-sm text-neutral-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-neutral-900">
              {stat.value}
            </p>
            {stat.note && (
              <p className="mt-1 text-xs font-medium text-amber-700">
                {stat.note}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { href: "/pets", label: "Browse listings" },
          { href: "/services", label: "Browse services" },
          { href: "/breeds", label: "Browse breeds" },
          { href: "/blog", label: "Browse blog" },
          { href: "/enquire", label: "Enquiry form" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-brand-700"
          >
            {link.label} &rarr;
          </Link>
        ))}
      </div>

      {/* Listing status breakdown */}
      {listingsByStatus.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-900">
            Listings by status
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {listingsByStatus.map((row) => (
              <span
                key={row.status}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700"
              >
                {titleCaseEnum(row.status)}{" "}
                <span className="font-semibold text-neutral-900">
                  {row._count._all}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent leads */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Recent leads
          </h2>
          <span className="text-sm text-neutral-500">
            Showing last {recentLeads.length} of {totalLeads}
          </span>
        </div>

        {recentLeads.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center">
            <p className="text-sm text-neutral-600">
              No leads yet. They appear here when someone submits the enquiry
              form.
            </p>
            <Link
              href="/enquire"
              className="mt-3 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              View enquiry form &rarr;
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Interest
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Received
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">
                          {lead.name}
                        </div>
                        {lead.email && (
                          <div className="text-xs text-neutral-500">
                            {lead.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        <a
                          href={`tel:${lead.phone.replace(/\s/g, "")}`}
                          className="hover:text-brand-700"
                        >
                          {lead.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        <div>
                          {[
                            lead.species ? titleCaseEnum(lead.species) : null,
                            lead.breed?.name ?? null,
                            lead.city?.name ?? null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </div>
                        {lead.requirement && (
                          <div
                            className="mt-0.5 max-w-[18rem] truncate text-xs text-neutral-400"
                            title={lead.requirement}
                          >
                            {lead.requirement}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            LEAD_STATUS_STYLES[lead.status]
                          }`}
                        >
                          {titleCaseEnum(lead.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </Container>
  );
}
