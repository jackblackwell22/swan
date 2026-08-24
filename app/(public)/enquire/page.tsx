import type { Metadata } from "next";
import { EnquireForm } from "@/components/enquire-form";
import { getBusinessConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Enquire",
};

export default function EnquirePage() {
  const config = getBusinessConfig();

  return (
    <article className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-brick uppercase">
          Availability
        </p>
        <h1 className="mt-2 text-4xl text-ink sm:text-5xl">Enquire</h1>
        <p className="mt-4 text-lg text-ink/80">
          Tell us whether you are a business or a private tenant, and whether
          you need the unit for a vehicle, storage, or something else. We will
          reply about what is free and what the rent would be.
        </p>
        <p className="mt-4 text-base text-ink/75">
          Please do not assume a unit is available because the doors appear in
          the photograph. We would rather answer a short enquiry than list
          vacancies that go out of date.
        </p>
        {config.email || config.phone ? (
          <p className="mt-6 text-sm text-muted-foreground">
            You can also reach us
            {config.email ? (
              <>
                {" "}
                by email at{" "}
                <a className="text-door underline-offset-2 hover:underline" href={`mailto:${config.email}`}>
                  {config.email}
                </a>
              </>
            ) : null}
            {config.email && config.phone ? " or" : null}
            {config.phone ? <> by telephone on {config.phone}</> : null}
            .
          </p>
        ) : null}
      </div>
      <EnquireForm />
    </article>
  );
}
