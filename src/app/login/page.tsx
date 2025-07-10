
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold mb-4">Login to ScheduleR</h1>
      <Button onClick={() => signIn("google")}>Sign in with Google</Button>
    </div>
  );
}
