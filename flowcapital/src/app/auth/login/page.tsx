"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
         localStorage.setItem("flowcapital_token", data.token);
         localStorage.setItem("flowcapital_user", JSON.stringify({ role: data.user.role, id: data.user.id }));
         const roleRoutes: Record<string, string> = {
           ADMIN: '/dashboard/admin',
           INVESTOR: '/dashboard/investor',
           ENTERPRISE: '/dashboard/enterprise',
           SME: '/dashboard/sme',
         };
         router.push(roleRoutes[data.user.role] || '/dashboard/sme');
      } else {
         alert(data.error || "Login fail");
      }
    } catch(err) {
       alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glass-card shadow-2xl border-border/50 backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>Enter your email to sign in to your FlowCapital account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required className="bg-background/50 h-11" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="password">Password</label>
                <Link href="#" className="text-xs text-blue-500 hover:text-blue-600 font-medium">Forgot password?</Link>
              </div>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-background/50 h-11" />
            </div>
            <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white mt-6 transition-all" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm border-t border-border/40 pt-6">
          <p className="text-muted-foreground mt-2">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-blue-500 hover:text-blue-600 font-medium hover:underline transition-all">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
