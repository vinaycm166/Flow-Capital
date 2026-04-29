import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-blue-500/30 overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />
      
      <header className="p-6 md:px-12 relative z-10 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-400 flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">FlowCapital</span>
        </Link>
        <ThemeToggle />
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
