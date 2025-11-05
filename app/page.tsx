import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  
  // If user is authenticated, redirect to onboarding or matches
  if (session) {
    const user = session as any;
    if (user.onboarded) {
      redirect("/matches");
    } else {
      redirect("/onboarding/role");
    }
  }
  
  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">FounderFinder</h1>
        <p className="text-gray-600">Helping CEOs and CTOs become cofounders.</p>
      </header>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
        <Link 
          href="/auth/signup" 
          className="rounded bg-black px-6 py-3 text-center text-white hover:bg-gray-800"
        >
          Sign up
        </Link>
        <Link 
          href="/auth/signin" 
          className="rounded border border-gray-300 px-6 py-3 text-center text-gray-700 hover:bg-gray-50"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}


