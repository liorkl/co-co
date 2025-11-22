"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
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
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-blue-800">Check your email!</h2>
          <p className="text-blue-700">
            We&apos;ve sent a sign-in link to <strong>{email}</strong>. 
            Click the link in the email to access your account.
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <button 
            onClick={() => setSent(false)} 
            className="text-blue-600 hover:underline"
          >
            try again
          </button>
          .
        </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Sign in</h1>
        <p className="text-gray-600">
          Enter your email to receive a sign-in link.
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
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>

      <div className="border-t pt-4">
        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}


