"use client";
import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "textarea" | "select";
  placeholder?: string;
  helperText?: string;
  example?: string;
  required?: boolean;
  error?: string;
  options?: { value: string; label: string }[];
  rows?: number;
}

export default function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  helperText,
  example,
  required = false,
  error,
  options,
  rows = 3,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
      {example && (
        <p className="text-xs text-gray-400 italic">Example: {example}</p>
      )}
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full rounded border px-3 py-2 ${
            error ? "border-red-500" : "border-gray-300"
          } focus:border-black focus:outline-none focus:ring-1 focus:ring-black`}
        />
      ) : type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded border px-3 py-2 ${
            error ? "border-red-500" : "border-gray-300"
          } focus:border-black focus:outline-none focus:ring-1 focus:ring-black`}
        >
          <option value="">Select...</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded border px-3 py-2 ${
            error ? "border-red-500" : "border-gray-300"
          } focus:border-black focus:outline-none focus:ring-1 focus:ring-black`}
        />
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}


