import { Sidebar } from "@/components/sidebar";
import { RoleGuard } from "@/components/role-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto bg-muted/20">
        <div className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto">
          <RoleGuard>
            {children}
          </RoleGuard>
        </div>
      </main>
    </div>
  );
}
