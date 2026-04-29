"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("flowcapital_user");
    const token = localStorage.getItem("flowcapital_token");

    if (!userData || !token) {
      router.replace("/");
      return;
    }

    const user = JSON.parse(userData);
    const role = user.role;

    if (pathname.includes("/dashboard/investor") && role !== "INVESTOR") {
      router.replace(role === "ENTERPRISE" ? "/dashboard/enterprise" : "/dashboard/sme");
      return;
    }

    if (pathname.includes("/dashboard/sme") && role !== "SME") {
      router.replace(role === "ENTERPRISE" ? "/dashboard/enterprise" : "/dashboard/investor");
      return;
    }

    if (pathname.includes("/dashboard/enterprise") && role !== "ENTERPRISE") {
      router.replace(role === "INVESTOR" ? "/dashboard/investor" : "/dashboard/sme");
      return;
    }

    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}
