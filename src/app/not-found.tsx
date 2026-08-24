import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Page not found</h1>
      <p className="mt-4 text-muted">
        That address is not part of Swan Street Lock-Ups.
      </p>
      <p className="mt-6">
        <Link href="/" className="font-semibold text-door hover:underline">
          Back to the home page
        </Link>
      </p>
    </div>
  );
}
