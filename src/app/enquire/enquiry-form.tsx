"use client";

import { useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { createLead, type LeadFormValues } from "./actions";

type BreedOption = { slug: string; name: string; species: string };
type CityOption = { slug: string; name: string; state: string };

type Props = {
  breeds: BreedOption[];
  cities: CityOption[];
  listingTitle: string | null;
  initial: Partial<LeadFormValues>;
};

type Step = 1 | 2 | 3;

const PURPOSE_OPTIONS = [
  { value: "buy", label: "Buy a pet" },
  { value: "adopt", label: "Adopt a pet" },
  { value: "mating", label: "Find a mate for my pet" },
  { value: "service", label: "Book a pet service" },
];

const SPECIES_OPTIONS = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "BIRD", label: "Bird" },
  { value: "RABBIT", label: "Rabbit" },
  { value: "FISH", label: "Fish" },
  { value: "HAMSTER", label: "Hamster" },
  { value: "TURTLE", label: "Turtle" },
  { value: "OTHER", label: "Other" },
];

const EMPTY: LeadFormValues = {
  purpose: "",
  species: "",
  breedSlug: "",
  citySlug: "",
  budgetMin: "",
  budgetMax: "",
  requirement: "",
  name: "",
  phone: "",
  email: "",
  message: "",
  listingSlug: "",
};

export function EnquiryForm({ breeds, cities, listingTitle, initial }: Props) {
  const [step, setStep] = useState<Step | "done">(1);
  const [form, setForm] = useState<LeadFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof LeadFormValues>(field: K, value: LeadFormValues[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const filteredBreeds = form.species
    ? breeds.filter((b) => b.species === form.species)
    : breeds;

  function validateStep3(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!form.phone.trim()) next.phone = "Please enter your phone number.";
    else if (!/^[+\d][\d\s\-]{7,14}$/.test(form.phone.trim())) {
      next.phone = "Please enter a valid phone number (e.g. 98765 43210).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validateStep3()) return;
    setSubmitError(null);
    startTransition(async () => {
      const result = await createLead(form);
      if (result.ok) {
        setStep("done");
      } else {
        setSubmitError(result.error);
      }
    });
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
        <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckIcon />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-neutral-900">
          We have received your enquiry!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-neutral-600">
          Our team will review your request and message you on WhatsApp within
          24 hours. You can also reach us directly at the number in the footer.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/pets" className={buttonClass("primary")}>
            Browse pets
          </a>
          <a href="/services" className={buttonClass("outline")}>
            Browse services
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      <StepIndicator current={step} />

      <div className="px-6 pb-8 pt-6 sm:px-8">
        {listingTitle && (
          <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            Enquiring about: <span className="font-medium">{listingTitle}</span>
          </div>
        )}

        {step === 1 && (
          <Step1
            form={form}
            set={set}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2
            form={form}
            set={set}
            filteredBreeds={filteredBreeds}
            cities={cities}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3
            form={form}
            set={set}
            errors={errors}
            submitError={submitError}
            isPending={isPending}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: Step | "done" }) {
  const activeStep = current === "done" ? 4 : current;
  return (
    <div className="flex items-center border-b border-neutral-200 px-6 py-5 sm:px-8">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center">
          {i > 0 && (
            <div
              className={`mx-2 h-px w-8 sm:w-14 ${
                activeStep > n ? "bg-brand-500" : "bg-neutral-200"
              }`}
            />
          )}
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              activeStep === n
                ? "bg-brand-600 text-white"
                : activeStep > n
                  ? "bg-brand-100 text-brand-700"
                  : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {activeStep > n ? <SmallCheckIcon /> : n}
          </span>
        </div>
      ))}
      <div className="ml-4 text-sm text-neutral-500">
        {current === 1 && "What are you looking for?"}
        {current === 2 && "Breed, location and budget"}
        {current === 3 && "Your contact details"}
      </div>
    </div>
  );
}

function Step1({
  form,
  set,
  onNext,
}: {
  form: LeadFormValues;
  set: <K extends keyof LeadFormValues>(k: K, v: LeadFormValues[K]) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2 className="text-xl font-bold text-neutral-900">
        What are you looking for?
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        All fields on this page are optional — skip anything that doesn&apos;t
        apply.
      </p>

      <div className="mt-6">
        <p className="text-sm font-medium text-neutral-800">I want to</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {PURPOSE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                set("purpose", form.purpose === opt.value ? "" : opt.value)
              }
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                form.purpose === opt.value
                  ? "border-brand-500 bg-brand-50 text-brand-800"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-neutral-800">Species</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPECIES_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                set("species", form.species === opt.value ? "" : opt.value)
              }
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                form.species === opt.value
                  ? "border-brand-500 bg-brand-600 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <button type="button" onClick={onNext} className={buttonClass("primary", "md")}>
          Next &rarr;
        </button>
      </div>
    </>
  );
}

function Step2({
  form,
  set,
  filteredBreeds,
  cities,
  onBack,
  onNext,
}: {
  form: LeadFormValues;
  set: <K extends keyof LeadFormValues>(k: K, v: LeadFormValues[K]) => void;
  filteredBreeds: BreedOption[];
  cities: CityOption[];
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2 className="text-xl font-bold text-neutral-900">
        Breed, location and budget
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        These help us match you with the right provider. All optional.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="breed"
            className="block text-sm font-medium text-neutral-800"
          >
            Breed
          </label>
          <select
            id="breed"
            value={form.breedSlug}
            onChange={(e) => set("breedSlug", e.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
          >
            <option value="">Any breed</option>
            {filteredBreeds.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-neutral-800"
          >
            City
          </label>
          <select
            id="city"
            value={form.citySlug}
            onChange={(e) => set("citySlug", e.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
          >
            <option value="">Any city</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}, {c.state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-neutral-800">
          Budget range (&#8377;)
        </p>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="budgetMin" className="sr-only">
              Minimum budget
            </label>
            <input
              id="budgetMin"
              type="number"
              min="0"
              step="500"
              inputMode="numeric"
              placeholder="Min (optional)"
              value={form.budgetMin}
              onChange={(e) => set("budgetMin", e.target.value)}
              className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </div>
          <div>
            <label htmlFor="budgetMax" className="sr-only">
              Maximum budget
            </label>
            <input
              id="budgetMax"
              type="number"
              min="0"
              step="500"
              inputMode="numeric"
              placeholder="Max (optional)"
              value={form.budgetMax}
              onChange={(e) => set("budgetMax", e.target.value)}
              className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="requirement"
          className="block text-sm font-medium text-neutral-800"
        >
          Tell us more (optional)
        </label>
        <textarea
          id="requirement"
          rows={3}
          placeholder="E.g. looking for a male Labrador puppy, vaccinated, ready by June…"
          value={form.requirement}
          onChange={(e) => set("requirement", e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400"
        />
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className={buttonClass("outline", "md")}
        >
          &larr; Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className={buttonClass("primary", "md")}
        >
          Next &rarr;
        </button>
      </div>
    </>
  );
}

function Step3({
  form,
  set,
  errors,
  submitError,
  isPending,
  onBack,
  onSubmit,
}: {
  form: LeadFormValues;
  set: <K extends keyof LeadFormValues>(k: K, v: LeadFormValues[K]) => void;
  errors: Partial<Record<keyof LeadFormValues, string>>;
  submitError: string | null;
  isPending: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <h2 className="text-xl font-bold text-neutral-900">
        How can we reach you?
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        We will follow up on WhatsApp. Your details are never shared with third
        parties.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-800"
          >
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Priya Sharma"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={`mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 ${
              errors.name ? "border-red-400" : "border-neutral-300"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-neutral-800"
          >
            Phone / WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="98765 43210"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={`mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 ${
              errors.phone ? "border-red-400" : "border-neutral-300"
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-800"
          >
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="priya@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="message"
            className="block text-sm font-medium text-neutral-800"
          >
            Anything else? (optional)
          </label>
          <textarea
            id="message"
            rows={3}
            placeholder="Any other details that would help us find the right match…"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {submitError && (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {submitError}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className={buttonClass("outline", "md")}
        >
          &larr; Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className={buttonClass("accent", "md")}
        >
          {isPending ? "Submitting…" : "Send enquiry"}
        </button>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        By submitting you agree to be contacted by PetHaven and matched
        providers via WhatsApp or phone.
      </p>
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SmallCheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
