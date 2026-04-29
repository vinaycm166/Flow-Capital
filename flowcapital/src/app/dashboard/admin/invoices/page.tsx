"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminInvoicesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin?tab=invoices");
  }, [router]);
  return null;
}
