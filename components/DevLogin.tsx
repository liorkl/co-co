"use client";

import { useState } from "react";

/**
 * Development-only login component for quick test authentication.
 * Only renders when NEXT_PUBLIC_SHOW_DEV_LOGIN is set to "true".
 *
 * This bypasses email verification by using the /api/test/auth endpoint.
 */

const TEST_USERS = [
  { email: "sarah.chen@test.founderfinder.com", role: "CEO", name: "Sarah Chen" },
  { email: "alex.kumar@test.founderfinder.com", role: "CTO", name: "Alex Kumar" },
  { email: "maria.garcia@test.founderfinder.com", role: "CEO", name: "Maria Garcia" },
  { email: "james.wilson@test.founderfinder.com", role: "CTO", name: "James Wilson" },
];

export function DevLogin() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only show in development mode when explicitly enabled
  if (process.env.NEXT_PUBLIC_SHOW_DEV_LOGIN !== "true") {
    return null;
  }

  const handleDevLogin = async (email: string) => {
    setLoading(email);
    setError(null);

    try {
      // Use the test auth endpoint which sets session cookies directly
      window.location.href = `/api/test/auth?email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(null);
    }
  };

  return (
    <div className="mt-6 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🧪</span>
        <h3 className="font-semibold text-yellow-800">Dev Quick Login</h3>
      </div>
      <p className="mb-3 text-sm text-yellow-700">
        Click to instantly sign in as a test user (dev mode only):
      </p>

      {error && (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      )}

      <div className="grid gap-2">
        {TEST_USERS.map((user) => (
          <button
            key={user.email}
            onClick={() => handleDevLogin(user.email)}
            disabled={loading !== null}
            className="flex items-center justify-between rounded border border-yellow-300 bg-white px-3 py-2 text-left text-sm transition hover:bg-yellow-100 disabled:opacity-50"
          >
            <span>
              <strong>{user.name}</strong>
              <span className="ml-2 text-gray-500">({user.role})</span>
            </span>
            {loading === user.email && (
              <span className="text-yellow-600">Loading...</span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-yellow-600">
        Test users must exist in the database. Run seed script if needed.
      </p>
    </div>
  );
}
