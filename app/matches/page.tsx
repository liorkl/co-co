"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Match = {
  userId: string;
  score: number;
  rationale?: string;
  name?: string;
  location?: string;
  timezone?: string;
  availability?: string;
  commitment?: string;
  startup?: {
    stage?: string;
    domain?: string;
    description?: string;
    funding?: string;
    equity_offer?: string;
    salary_offer?: string;
  } | null;
  techBackground?: {
    primary_stack?: string;
    years_experience?: number;
    domains?: string;
    track_record?: string;
  } | null;
};

function getMatchQuality(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 0.8) {
    return { label: "Excellent Match", color: "text-green-700", bgColor: "bg-green-50" };
  } else if (score >= 0.6) {
    return { label: "Strong Match", color: "text-blue-700", bgColor: "bg-blue-50" };
  } else if (score >= 0.4) {
    return { label: "Good Match", color: "text-yellow-700", bgColor: "bg-yellow-50" };
  } else {
    return { label: "Potential Match", color: "text-gray-700", bgColor: "bg-gray-50" };
  }
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your Matches</h1>
          <Link 
            href="/auth/signout" 
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </Link>
        </div>
        <p className="text-gray-600">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Matches</h1>
          <p className="mt-1 text-sm text-gray-600">
            {matches.length > 0 
              ? `Found ${matches.length} potential cofounder${matches.length > 1 ? 's' : ''}`
              : "Discover your perfect cofounder match"
            }
          </p>
        </div>
        <Link 
          href="/auth/signout" 
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="text-4xl">🔍</div>
            <h2 className="text-xl font-semibold text-gray-900">
              We&apos;re searching for your perfect match
            </h2>
            <p className="text-gray-600">
              Our AI is analyzing profiles to find the best cofounder match for you. 
              This process takes a bit of time to ensure quality matches.
            </p>
            <p className="text-sm text-gray-500">
              We&apos;ll notify you via email as soon as we find potential matches. 
              Sit tight—great partnerships are worth the wait!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const quality = getMatchQuality(match.score);
            return (
              <div
                key={match.userId}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header with name and match score */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {match.name || "Anonymous"}
                      </h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${quality.color} ${quality.bgColor}`}>
                        {quality.label}
                      </span>
                    </div>
                    
                    {/* Location and availability */}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                      {match.location && (
                        <span className="flex items-center gap-1">
                          📍 {match.location}
                        </span>
                      )}
                      {match.timezone && (
                        <span className="flex items-center gap-1">
                          🕐 {match.timezone}
                        </span>
                      )}
                      {match.availability && (
                        <span className="flex items-center gap-1">
                          {match.availability}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Match score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatScore(match.score)}
                    </div>
                    <div className="text-xs text-gray-500">Match Score</div>
                  </div>
                </div>

                {/* Role-specific information */}
                {match.startup && (
                  <div className="mb-4 rounded-lg bg-blue-50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">Startup Details</h3>
                    <div className="space-y-2 text-sm">
                      {match.startup.domain && (
                        <div>
                          <span className="font-medium text-gray-700">Domain:</span>{" "}
                          <span className="text-gray-600">{match.startup.domain}</span>
                        </div>
                      )}
                      {match.startup.stage && (
                        <div>
                          <span className="font-medium text-gray-700">Stage:</span>{" "}
                          <span className="text-gray-600">{match.startup.stage}</span>
                        </div>
                      )}
                      {match.startup.description && (
                        <div>
                          <span className="font-medium text-gray-700">About:</span>{" "}
                          <span className="text-gray-600">{match.startup.description}</span>
                        </div>
                      )}
                      {match.startup.funding && (
                        <div>
                          <span className="font-medium text-gray-700">Funding:</span>{" "}
                          <span className="text-gray-600">{match.startup.funding}</span>
                        </div>
                      )}
                      {(match.startup.equity_offer || match.startup.salary_offer) && (
                        <div className="flex gap-4">
                          {match.startup.equity_offer && (
                            <div>
                              <span className="font-medium text-gray-700">Equity:</span>{" "}
                              <span className="text-gray-600">{match.startup.equity_offer}</span>
                            </div>
                          )}
                          {match.startup.salary_offer && (
                            <div>
                              <span className="font-medium text-gray-700">Salary:</span>{" "}
                              <span className="text-gray-600">{match.startup.salary_offer}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {match.techBackground && (
                  <div className="mb-4 rounded-lg bg-purple-50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">Technical Background</h3>
                    <div className="space-y-2 text-sm">
                      {match.techBackground.primary_stack && (
                        <div>
                          <span className="font-medium text-gray-700">Stack:</span>{" "}
                          <span className="text-gray-600">{match.techBackground.primary_stack}</span>
                        </div>
                      )}
                      {match.techBackground.years_experience && (
                        <div>
                          <span className="font-medium text-gray-700">Experience:</span>{" "}
                          <span className="text-gray-600">{match.techBackground.years_experience} years</span>
                        </div>
                      )}
                      {match.techBackground.domains && (
                        <div>
                          <span className="font-medium text-gray-700">Domains:</span>{" "}
                          <span className="text-gray-600">{match.techBackground.domains}</span>
                        </div>
                      )}
                      {match.techBackground.track_record && (
                        <div>
                          <span className="font-medium text-gray-700">Track Record:</span>{" "}
                          <span className="text-gray-600">{match.techBackground.track_record}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Match rationale/insights */}
                {match.rationale && (
                  <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">
                      💡 Why this is a great match
                    </h3>
                    <div className="whitespace-pre-line text-sm text-gray-700">
                      {match.rationale}
                    </div>
                  </div>
                )}

                {/* Commitment info */}
                {match.commitment && (
                  <div className="mt-4 text-sm text-gray-600">
                    <span className="font-medium">Commitment:</span> {match.commitment}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}


