"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CEOOnboarding() {
  const [form, setForm] = useState({
    name: "",
    location: "",
    stage: "",
    domain: "",
    description: "",
    equity_offer: "",
    salary_offer: "",
    freeText: "",
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/interview/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "CEO", structured: form, freeText: form.freeText }),
    });
    router.push("/matches");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold">CEO interview</h1>
      {[
        ["name", "Your name"],
        ["location", "Location"],
        ["stage", "Startup stage"],
        ["domain", "Domain"],
        ["equity_offer", "Equity offer"],
        ["salary_offer", "Salary offer"],
      ].map(([key, label]) => (
        <div key={key as string} className="space-y-1">
          <label className="block text-sm text-gray-700">{label}</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={(form as any)[key]}
            onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
          />
        </div>
      ))}
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">Describe what you need from a CTO</label>
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={5}
          value={form.freeText}
          onChange={(e) => setForm({ ...form, freeText: e.target.value })}
        />
      </div>
      <button className="rounded bg-black px-4 py-2 text-white" disabled={saving}>
        {saving ? "Saving..." : "Save and see matches"}
      </button>
      </form>
    </div>
  );
}


