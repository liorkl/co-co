"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MultiStepForm, { Step } from "@/components/onboarding/MultiStepForm";
import FormField from "@/components/onboarding/FormField";
import TrustMessaging from "@/components/onboarding/TrustMessaging";
import { track } from "@/lib/analytics";

interface CTOFormData {
  name: string;
  location: string;
  primary_stack: string;
  years_experience: string;
  domains: string;
  track_record: string;
  freeText: string;
}

export default function CTOOnboarding() {
  const router = useRouter();
  const [formData, setFormData] = useState<CTOFormData>({
    name: "",
    location: "",
    primary_stack: "",
    years_experience: "",
    domains: "",
    track_record: "",
    freeText: "",
  });

  const updateField = (field: keyof CTOFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    return !!(formData.name.trim() && formData.location.trim());
  };

  const validateStep2 = (): boolean => {
    return !!(formData.primary_stack && formData.years_experience);
  };

  const validateStep3 = (): boolean => {
    return !!formData.track_record.trim();
  };

  const handleComplete = async (data: CTOFormData) => {
    track({ type: "onboarding_step", step: "cto_complete" });
    try {
      const response = await fetch("/api/interview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CTO", structured: data, freeText: data.freeText }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to submit onboarding: ${response.statusText}`);
      }
      router.push("/matches");
    } catch (error) {
      // Re-throw to let MultiStepForm handle error display
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error: Failed to submit onboarding");
    }
  };

  const steps: Step[] = [
    {
      id: "basic-info",
      title: "Tell us about yourself",
      description: "Let's start with the basics to help us understand who you are.",
      validate: validateStep1,
      component: (
        <div className="space-y-6">
          <FormField
            label="Your name"
            name="name"
            value={formData.name}
            onChange={(v) => updateField("name", v)}
            placeholder="Jane Smith"
            helperText="This will be visible to potential cofounders"
            example="Jane Smith"
            required
          />
          <FormField
            label="Location"
            name="location"
            value={formData.location}
            onChange={(v) => updateField("location", v)}
            placeholder="New York, NY"
            helperText="City and state/country where you&apos;re based"
            example="New York, NY or Remote"
            required
          />
          <TrustMessaging />
        </div>
      ),
    },
    {
      id: "technical-background",
      title: "Your technical background",
      description: "Help us understand your technical expertise.",
      validate: validateStep2,
      component: (
        <div className="space-y-6">
          <FormField
            label="Primary tech stack"
            name="primary_stack"
            value={formData.primary_stack}
            onChange={(v) => updateField("primary_stack", v)}
            placeholder="React, Node.js, Python, etc."
            helperText="What technologies are you most experienced with?"
            example="React, Node.js, TypeScript, PostgreSQL"
            required
          />
          <FormField
            label="Years of experience"
            name="years_experience"
            value={formData.years_experience}
            onChange={(v) => updateField("years_experience", v)}
            type="select"
            helperText="How many years of professional software development experience do you have?"
            required
            options={[
              { value: "0-2", label: "0-2 years" },
              { value: "3-5", label: "3-5 years" },
              { value: "6-10", label: "6-10 years" },
              { value: "10+", label: "10+ years" },
            ]}
          />
        </div>
      ),
    },
    {
      id: "experience",
      title: "Your experience and interests",
      description: "Tell us about your track record and what domains interest you.",
      validate: validateStep3,
      component: (
        <div className="space-y-6">
          <FormField
            label="Track record highlights"
            name="track_record"
            value={formData.track_record}
            onChange={(v) => updateField("track_record", v)}
            type="textarea"
            rows={4}
            placeholder="Describe your key achievements, projects, or companies you've worked with..."
            helperText="Highlight your most impressive work or accomplishments"
            example="Led engineering team at Series A startup, scaled system to 1M+ users. Built and launched 3 successful SaaS products."
            required
          />
          <FormField
            label="Domains of interest"
            name="domains"
            value={formData.domains}
            onChange={(v) => updateField("domains", v)}
            placeholder="SaaS, FinTech, Healthcare, etc."
            helperText="What industries or domains are you interested in working in?"
            example="SaaS, FinTech, Healthcare"
          />
        </div>
      ),
    },
    {
      id: "preferences",
      title: "What you&apos;re looking for",
      description: "Help us match you with the right CEO and startup.",
      component: (
        <div className="space-y-6">
          <FormField
            label="What are you looking for in a CEO/startup?"
            name="freeText"
            value={formData.freeText}
            onChange={(v) => updateField("freeText", v)}
            type="textarea"
            rows={6}
            placeholder="Describe what you&apos;re looking for in a cofounder and startup opportunity..."
            helperText="Be specific about what matters to you: stage, team size, equity expectations, working style, etc."
            example="Looking for an early-stage startup (idea to MVP) with a strong business-minded CEO. Prefer equity-heavy compensation. Interested in B2B SaaS or marketplace businesses. Value clear communication and product-market fit focus."
          />
        </div>
      ),
    },
    {
      id: "preview",
      title: "Review your information",
      description: "Please review everything before submitting. You can go back to make changes.",
      component: (
        <div className="space-y-6 rounded-lg border p-6">
          <div>
            <h3 className="font-semibold text-gray-700">Basic Information</h3>
            <p className="text-gray-600">Name: {formData.name || "Not provided"}</p>
            <p className="text-gray-600">Location: {formData.location || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Technical Background</h3>
            <p className="text-gray-600">Primary Stack: {formData.primary_stack || "Not provided"}</p>
            <p className="text-gray-600">Experience: {formData.years_experience || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Experience</h3>
            <p className="text-gray-600">Track Record: {formData.track_record || "Not provided"}</p>
            <p className="text-gray-600">Domains: {formData.domains || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">What you&apos;re looking for</h3>
            <p className="text-gray-600">{formData.freeText || "Not provided"}</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <MultiStepForm
      steps={steps}
      onComplete={handleComplete}
      initialData={formData}
      storageKey="cto-onboarding-draft"
      formData={formData}
      onFormDataChange={setFormData}
    />
  );
}
