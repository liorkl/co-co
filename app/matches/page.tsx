"use client";
import { useEffect, useState } from "react";

type Match = { userId: string; score: number; rationale?: string };

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/match/preview", { method: "POST" });
      const data = await res.json();
      setMatches(data.matches ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading matches...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your Matches</h1>
      {matches.length === 0 && <p>No matches yet. Complete your interview to get recommendations.</p>}
      <ul className="space-y-3">
        {matches.map((m) => (
          <li key={m.userId} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">User {m.userId.slice(0, 8)}...</div>
                <div className="text-sm text-gray-600">Score: {m.score.toFixed(3)}</div>
              </div>
            </div>
            {m.rationale && (
              <div className="mt-2 whitespace-pre-line text-sm text-gray-800">{m.rationale}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}


