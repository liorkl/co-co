"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RolePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function choose(role: "CEO" | "CTO") {
    setLoading(role);
    await fetch("/api/user/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.push(role === "CEO" ? "/onboarding/ceo" : "/onboarding/cto");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Select your role</h1>
      <div className="flex gap-4">
        <button
          onClick={() => choose("CEO")}
          className="rounded bg-black px-4 py-2 text-white"
          disabled={loading !== null}
        >
          {loading === "CEO" ? "Loading..." : "I am a CEO"}
        </button>
        <button
          onClick={() => choose("CTO")}
          className="rounded bg-black px-4 py-2 text-white"
          disabled={loading !== null}
        >
          {loading === "CTO" ? "Loading..." : "I am a CTO"}
        </button>
      </div>
    </div>
  );
}


