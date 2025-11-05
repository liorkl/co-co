import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">FounderFinder</h1>
        <p className="text-gray-600">Helping CEOs and CTOs become cofounders.</p>
      </header>
      <div className="space-x-4">
        <Link href="/auth/signin" className="rounded bg-black px-4 py-2 text-white">
          Get started
        </Link>
      </div>
    </main>
  );
}


