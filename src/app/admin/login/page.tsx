import { canOpenDevDesk, ownersConfigured } from "@/lib/auth";
import { openOwnersDeskAction, loginAction } from "../actions";

export const metadata = { title: "Owners’ desk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const configured = ownersConfigured();
  const devDesk = canOpenDevDesk();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-lg border border-line bg-paper p-8 shadow-sm">
        <h1 className="font-display text-3xl text-door">Owners’ desk</h1>
        <p className="mt-2 text-sm text-muted">
          For Jack Blackwell and David Blackwell. Sign in with the username and
          password stored on this computer, not in the website files.
        </p>
        {!configured ? (
          <p className="mt-6 rounded-md bg-brick/10 px-4 py-3 text-sm text-brick-dark">
            No owner logins are set yet. Add JACK_USERNAME, JACK_PASSWORD,
            DAVID_USERNAME and DAVID_PASSWORD (and SESSION_SECRET) in your
            environment file, then restart the site.
          </p>
        ) : null}
        {params.error === "1" ? (
          <p className="mt-4 rounded-md bg-brick/10 px-4 py-3 text-sm" role="alert">
            That username or password was not recognised.
          </p>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Username</span>
            <input
              name="username"
              autoComplete="username"
              required
              className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-door px-4 py-3 font-semibold text-white hover:bg-door-dark"
          >
            Sign in
          </button>
        </form>
        {devDesk ? (
          <form action={openOwnersDeskAction} className="mt-4">
            <button
              type="submit"
              className="w-full rounded-md border border-door px-4 py-3 text-sm font-semibold text-door hover:bg-cream"
            >
              Open the owners’ desk
            </button>
            <p className="mt-2 text-xs text-muted">
              This shortcut only appears while you are running the site on your
              own computer, and only if the owner passwords are already set in
              the environment. It is never built into the public website.
            </p>
          </form>
        ) : null}
        <p className="mt-6 text-center text-sm">
          <a href="/" className="text-door hover:underline">
            Back to the public site
          </a>
        </p>
      </div>
    </div>
  );
}
