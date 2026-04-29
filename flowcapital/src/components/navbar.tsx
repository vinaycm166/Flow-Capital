"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 w-full z-50 glass border-b border-border/40"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-400 flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            FlowCapital
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
          <Link href="/transparency" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Transparency</Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
              Join Protocol
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
