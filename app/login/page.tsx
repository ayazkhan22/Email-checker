import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAuthenticated } from "@/lib/require-auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-96 h-64 rounded-xl" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
