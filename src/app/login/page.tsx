import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${site.name} account.`,
  robots: { index: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const callbackUrl = firstValue(params.callbackUrl) ?? "/admin";

  return (
    <Container className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Sign in to {site.name}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Admin and provider access only.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm">
          <LoginForm callbackUrl={callbackUrl} />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Trouble signing in? Contact{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-brand-700 hover:text-brand-800"
          >
            {site.email}
          </a>
        </p>
      </div>
    </Container>
  );
}
