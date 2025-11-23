"use client";
import { useState, useEffect, ReactNode } from "react";
import { track } from "@/lib/analytics";

export interface Step {
  id: string;
  title: string;
  description?: string;
  component: ReactNode;
  validate?: () => boolean;
}

interface MultiStepFormProps {
  steps: Step[];
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  storageKey?: string;
  formData?: any; // Controlled form data from parent
  onFormDataChange?: (data: any) => void; // Callback to update parent's formData
}

export default function MultiStepForm({
  steps,
  onComplete,
  initialData = {},
  storageKey,
  formData: controlledFormData,
  onFormDataChange,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  // Use controlled formData if provided, otherwise use internal state
  const [internalFormData, setInternalFormData] = useState(initialData);
  const formData = controlledFormData !== undefined ? controlledFormData : internalFormData;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Update internal state when controlled formData changes
  useEffect(() => {
    if (controlledFormData !== undefined) {
      setInternalFormData(controlledFormData);
    }
  }, [controlledFormData]);

  // Load from localStorage on mount
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const updatedData = { ...formData, ...parsed };
          if (onFormDataChange) {
            onFormDataChange(updatedData);
          } else {
            setInternalFormData(updatedData);
          }
        } catch (e) {
          console.error("Failed to load saved data", e);
        }
      }
      // Mark as loaded even if no saved data exists, to prevent autosave from overwriting
      setHasLoadedFromStorage(true);
    } else {
      // If no storageKey, mark as loaded immediately
      setHasLoadedFromStorage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]); // Only run on mount

  // Autosave to localStorage (only after initial load completes)
  useEffect(() => {
    if (storageKey && typeof window !== "undefined" && hasLoadedFromStorage) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (e) {
        // Handle QuotaExceededError or other storage errors gracefully
        console.warn("Failed to save to localStorage", e);
      }
    }
  }, [formData, storageKey, hasLoadedFromStorage]);

  const validateCurrentStep = (): boolean => {
    if (steps.length === 0 || currentStep >= steps.length) {
      return false;
    }
    const step = steps[currentStep];
    if (step.validate) {
      const isValid = step.validate();
      if (!isValid) {
        setErrors((prev) => ({ ...prev, [step.id]: "Please complete all required fields" }));
        return false;
      }
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[step.id];
      return next;
    });
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    // Clear any previous submission errors when moving forward
    setErrors((prev) => {
      const next = { ...prev };
      delete next._submit;
      return next;
    });

    // Track step completion (safe because validateCurrentStep already checked bounds)
    if (steps.length > 0 && currentStep < steps.length) {
      track({ type: "onboarding_step", step: steps[currentStep].id });
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // If the next step is the preview step (last step), set isPreview to true
      if (nextStep === steps.length - 1) {
        setIsPreview(true);
      }
    } else {
      setIsPreview(true);
    }
  };

  const handleBack = () => {
    // Clear submission errors when going back
    setErrors((prev) => {
      const next = { ...prev };
      delete next._submit;
      return next;
    });

    if (isPreview) {
      setIsPreview(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onComplete(formData);
      // Clear localStorage on success
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.removeItem(storageKey);
        } catch (e) {
          console.warn("Failed to clear localStorage", e);
        }
      }
    } catch (error) {
      console.error("Submission error", error);
      setErrors((prev) => ({
        ...prev,
        _submit: error instanceof Error ? error.message : "Failed to submit. Please try again.",
      }));
      setSaving(false);
    }
  };

  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Progress Bar */}
      {steps.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-black transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      {steps.length > 0 && currentStep < steps.length ? (
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold">{steps[currentStep].title}</h1>
          {steps[currentStep].description && (
            <p className="mb-6 text-gray-600">{steps[currentStep].description}</p>
          )}
          {errors._submit && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
              {errors._submit}
            </div>
          )}
          {errors[steps[currentStep].id] && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
              {errors[steps[currentStep].id]}
            </div>
          )}
          <div className="min-h-[300px]">
            {steps[currentStep].component}
          </div>
        </div>
      ) : (
        <div className="mb-8 text-center text-gray-500">
          No steps available
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0 && !isPreview}
          className="rounded px-4 py-2 text-gray-700 disabled:opacity-50"
        >
          ← Back
        </button>
        {isPreview ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded bg-black px-6 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Complete Onboarding"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded bg-black px-6 py-2 text-white"
          >
            {currentStep === steps.length - 2 ? "Review" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}

