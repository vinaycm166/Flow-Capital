"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPaymentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin?tab=payments");
  }, [router]);
  return null;
}
