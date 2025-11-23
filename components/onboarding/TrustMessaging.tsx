"use client";

export default function TrustMessaging() {
  return (
    <div className="my-8 rounded-lg bg-blue-50 p-6">
      <h3 className="mb-2 text-lg font-semibold text-blue-900">
        Quality Match Guarantee
      </h3>
      <p className="mb-4 text-sm text-blue-800">
        We use AI-powered matching to connect you with highly compatible cofounders. 
        Our algorithm analyzes experience, goals, and working style to ensure quality matches.
      </p>
      <div className="space-y-2 text-sm text-blue-700">
        <div className="flex items-start">
          <span className="mr-2">✓</span>
          <span>Privacy-first: Your data is encrypted and never shared without consent</span>
        </div>
        <div className="flex items-start">
          <span className="mr-2">✓</span>
          <span>Curated matches: Only high-quality, verified profiles</span>
        </div>
        <div className="flex items-start">
          <span className="mr-2">✓</span>
          <span>Free to start: No credit card required</span>
        </div>
      </div>
    </div>
  );
}


