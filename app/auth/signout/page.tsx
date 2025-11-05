"use client";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div className="max-w-md">
      <p>Signing you out...</p>
    </div>
  );
}

