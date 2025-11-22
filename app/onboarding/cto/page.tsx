"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CTOOnboarding() {
  const [form, setForm] = useState({
    name: "",
    location: "",
    primary_stack: "",
    years_experience: "",
    domains: "",
    track_record: "",
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
      body: JSON.stringify({ role: "CTO", structured: form, freeText: form.freeText }),
    });
    router.push("/matches");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold">CTO interview</h1>
      {[
        ["name", "Your name"],
        ["location", "Location"],
        ["primary_stack", "Primary stack"],
        ["years_experience", "Years of experience"],
        ["domains", "Domains of interest"],
        ["track_record", "Track record highlights"],
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
        <label className="block text-sm text-gray-700">What are you looking for in a CEO/startup?</label>
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


