"use client";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <p>Signing you out...</p>
    </div>
  );
}

