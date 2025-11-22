"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackPageView, trackCTAClick } from "@/lib/analytics";

export default function LandingPage() {
  useEffect(() => {
    trackPageView("/");
  }, []);

  const handleCTAClick = (role: "CEO" | "CTO", cta: string) => {
    trackCTAClick(cta, role);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Find Your Perfect
            <span className="block text-black">Cofounder Match</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl max-w-2xl mx-auto">
            AI-powered matching connects CEOs with technical cofounders and vice versa. 
            Get curated matches based on skills, vision, and compatibility—not just keywords.
          </p>
          
          {/* Segmented CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup?role=CEO"
              onClick={() => handleCTAClick("CEO", "hero_ceo_signup")}
              className="rounded-lg bg-black px-8 py-4 text-center text-lg font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              I&apos;m a CEO
              <span className="block text-sm font-normal text-gray-300 mt-1">
                Find your technical cofounder
              </span>
            </Link>
            <Link
              href="/auth/signup?role=CTO"
              onClick={() => handleCTAClick("CTO", "hero_cto_signup")}
              className="rounded-lg border-2 border-black px-8 py-4 text-center text-lg font-semibold text-black transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              I&apos;m a CTO
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Find your business cofounder
              </span>
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-gray-500">
            Already have an account?{" "}
            <Link 
              href="/auth/signin" 
              className="font-medium text-black hover:underline"
              onClick={() => handleCTAClick("CEO", "hero_signin")}
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Value Bullets */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">🎯</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                AI-Powered Matching
              </h3>
              <p className="text-gray-600">
                Semantic similarity matching goes beyond keywords to find true compatibility 
                based on skills, experience, and vision.
              </p>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">⚡</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Fast Onboarding
              </h3>
              <p className="text-gray-600">
                Complete your profile in under 5 minutes. Get your first curated matches 
                within hours, not weeks.
              </p>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">🔒</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Privacy First
              </h3>
              <p className="text-gray-600">
                Your data stays private. We only share what you approve, and you control 
                every introduction.
              </p>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">📊</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Quality Over Quantity
              </h3>
              <p className="text-gray-600">
                Get 3–5 high-signal matches with detailed rationale, not hundreds of 
                irrelevant profiles.
              </p>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">🤝</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Curated Introductions
              </h3>
              <p className="text-gray-600">
                Request introductions with context. We help facilitate meaningful connections 
                between matched founders.
              </p>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">🚀</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Free to Start
              </h3>
              <p className="text-gray-600">
                No credit card required. Create your profile, see your matches, and decide 
                when you&apos;re ready to connect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">
            Trusted by Founders
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <p className="mb-4 text-gray-700 italic">
                &quot;Found my technical cofounder in 2 weeks. The AI matching really understood 
                what I was looking for beyond just tech stack.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Chen</p>
                  <p className="text-sm text-gray-500">CEO, FinTech Startup</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <p className="mb-4 text-gray-700 italic">
                &quot;As a developer, I was skeptical of matching platforms. But the quality of 
                matches here is genuinely impressive. Found my cofounder on match #2.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div>
                  <p className="font-semibold text-gray-900">Marcus Rodriguez</p>
                  <p className="text-sm text-gray-500">CTO, SaaS Platform</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <p className="mb-4 text-gray-700 italic">
                &quot;The onboarding was quick, and the match explanations helped me understand 
                why each person was a good fit. Much better than scrolling through LinkedIn.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div>
                  <p className="font-semibold text-gray-900">Alex Kim</p>
                  <p className="text-sm text-gray-500">CEO, HealthTech Startup</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to Find Your Cofounder?
          </h2>
          <p className="mb-8 text-lg text-gray-300">
            Join hundreds of founders already using FounderFinder to build their teams.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup?role=CEO"
              onClick={() => handleCTAClick("CEO", "footer_ceo_signup")}
              className="rounded-lg bg-white px-8 py-4 text-center text-lg font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            >
              Start as CEO
            </Link>
            <Link
              href="/auth/signup?role=CTO"
              onClick={() => handleCTAClick("CTO", "footer_cto_signup")}
              className="rounded-lg border-2 border-white px-8 py-4 text-center text-lg font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            >
              Start as CTO
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


