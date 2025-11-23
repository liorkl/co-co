"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MultiStepForm, { Step } from "@/components/onboarding/MultiStepForm";
import FormField from "@/components/onboarding/FormField";
import TrustMessaging from "@/components/onboarding/TrustMessaging";
import { track } from "@/lib/analytics";

interface CEOFormData {
  name: string;
  location: string;
  stage: string;
  domain: string;
  description: string;
  equity_offer: string;
  salary_offer: string;
  freeText: string;
}

export default function CEOOnboarding() {
  const router = useRouter();
  const [formData, setFormData] = useState<CEOFormData>({
    name: "",
    location: "",
    stage: "",
    domain: "",
    description: "",
    equity_offer: "",
    salary_offer: "",
    freeText: "",
  });

  const updateField = (field: keyof CEOFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    return !!(formData.name.trim() && formData.location.trim());
  };

  const validateStep2 = (): boolean => {
    return !!(formData.stage && formData.domain);
  };

  const validateStep3 = (): boolean => {
    return !!formData.description.trim();
  };

  const handleComplete = async (data: CEOFormData) => {
    track({ type: "onboarding_step", step: "ceo_complete" });
    try {
      const response = await fetch("/api/interview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CEO", structured: data, freeText: data.freeText }),
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
            placeholder="John Doe"
            helperText="This will be visible to potential cofounders"
            example="John Doe"
            required
          />
          <FormField
            label="Location"
            name="location"
            value={formData.location}
            onChange={(v) => updateField("location", v)}
            placeholder="San Francisco, CA"
            helperText="City and state/country where you&apos;re based"
            example="San Francisco, CA or Remote"
            required
          />
          <TrustMessaging />
        </div>
      ),
    },
    {
      id: "startup-info",
      title: "About your startup",
      description: "Help us understand your startup's stage and focus.",
      validate: validateStep2,
      component: (
        <div className="space-y-6">
          <FormField
            label="Startup stage"
            name="stage"
            value={formData.stage}
            onChange={(v) => updateField("stage", v)}
            type="select"
            helperText="What stage is your startup currently at?"
            required
            options={[
              { value: "idea", label: "Idea stage - Just an idea" },
              { value: "mvp", label: "MVP - Building the product" },
              { value: "early", label: "Early stage - Some traction" },
              { value: "growth", label: "Growth stage - Scaling up" },
            ]}
          />
          <FormField
            label="Domain/Industry"
            name="domain"
            value={formData.domain}
            onChange={(v) => updateField("domain", v)}
            placeholder="SaaS, FinTech, Healthcare, etc."
            helperText="What industry or domain does your startup operate in?"
            example="SaaS, FinTech, Healthcare, E-commerce"
            required
          />
        </div>
      ),
    },
    {
      id: "description",
      title: "Describe your startup",
      description: "Give potential cofounders a clear picture of what you&apos;re building.",
      validate: validateStep3,
      component: (
        <div className="space-y-6">
          <FormField
            label="Startup description"
            name="description"
            value={formData.description}
            onChange={(v) => updateField("description", v)}
            type="textarea"
            rows={5}
            placeholder="Describe your startup, the problem you&apos;re solving, and your vision..."
            helperText="Be specific about what you&apos;re building and why it matters"
            example="We're building a B2B SaaS platform that helps small businesses manage their inventory. Our goal is to reduce waste and increase efficiency for retailers."
            required
          />
        </div>
      ),
    },
    {
      id: "offer",
      title: "What you&apos;re offering",
      description: "Help potential cofounders understand the opportunity.",
      component: (
        <div className="space-y-6">
          <FormField
            label="Equity offer"
            name="equity_offer"
            value={formData.equity_offer}
            onChange={(v) => updateField("equity_offer", v)}
            placeholder="e.g., 10-20%"
            helperText="What equity percentage are you offering? (Optional but recommended)"
            example="10-20%"
          />
          <FormField
            label="Salary offer"
            name="salary_offer"
            value={formData.salary_offer}
            onChange={(v) => updateField("salary_offer", v)}
            placeholder="e.g., $80k-$120k or Equity-only"
            helperText="What salary range can you offer? (Can be equity-only)"
            example="$80k-$120k or Equity-only"
          />
        </div>
      ),
    },
    {
      id: "needs",
      title: "What you need from a CTO",
      description: "Describe the ideal technical cofounder for your startup.",
      component: (
        <div className="space-y-6">
          <FormField
            label="What are you looking for in a CTO?"
            name="freeText"
            value={formData.freeText}
            onChange={(v) => updateField("freeText", v)}
            type="textarea"
            rows={6}
            placeholder="Describe the technical skills, experience, and qualities you&apos;re looking for in a cofounder..."
            helperText="Be specific about technical requirements, leadership style, and what success looks like"
            example="Looking for a full-stack engineer with 5+ years experience in React/Node.js. Should be comfortable leading a small team and making technical decisions. Experience with SaaS products and scaling infrastructure is a plus."
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
            <h3 className="font-semibold text-gray-700">Startup Details</h3>
            <p className="text-gray-600">Stage: {formData.stage || "Not provided"}</p>
            <p className="text-gray-600">Domain: {formData.domain || "Not provided"}</p>
            <p className="text-gray-600">Description: {formData.description || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Offer</h3>
            <p className="text-gray-600">Equity: {formData.equity_offer || "Not specified"}</p>
            <p className="text-gray-600">Salary: {formData.salary_offer || "Not specified"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">What you need</h3>
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
      storageKey="ceo-onboarding-draft"
      formData={formData}
      onFormDataChange={setFormData}
    />
  );
}
