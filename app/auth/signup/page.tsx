"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("email", { email, redirect: false });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-green-800">Check your email!</h2>
          <p className="text-green-700">
            We've sent a sign-up link to <strong>{email}</strong>. 
            Click the link in the email to create your account.
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Didn't receive the email? Check your spam folder or{" "}
          <button 
            onClick={() => setSent(false)} 
            className="text-blue-600 hover:underline"
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Create your account</h1>
        <p className="text-gray-600">
          Join FounderFinder to find your perfect cofounder match.
        </p>
      </div>
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50 hover:bg-gray-800"
        >
          {loading ? "Sending..." : "Continue with email"}
        </button>
      </form>

      <div className="border-t pt-4">
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

