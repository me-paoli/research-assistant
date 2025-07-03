"use client"
import { Suspense } from "react";
import AuthCallbackInner from "./AuthCallbackInner";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Verifying your email...</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
} 