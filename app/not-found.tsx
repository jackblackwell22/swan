import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-4xl text-ink">Page not found</h1>
      <p className="mt-3 text-ink/80">
        That address is not on the Swan Street Lock-Ups site.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-door underline-offset-2 hover:underline">
          Back to the home page
        </Link>
      </p>
    </div>
  );
}
