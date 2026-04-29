"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Loader2, Users, Briefcase, Building2 } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState(searchParams.get("role") || "SME");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
         localStorage.setItem("flowcapital_token", data.token);
         localStorage.setItem("flowcapital_user", JSON.stringify({ role: data.user.role, id: data.user.id }));
         if (data.user.role === 'INVESTOR') {
            router.push("/dashboard/investor");
         } else if (data.user.role === 'ENTERPRISE') {
            router.push("/dashboard/enterprise");
         } else {
            router.push("/dashboard/sme");
         }
      } else {
         alert(data.error || "Registration failed");
      }
    } catch(err) {
       alert("Server config error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glass-card shadow-2xl border-border/50 backdrop-blur-xl">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>Join FlowCapital to access instant liquidity or invest.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex p-1 bg-secondary/50 rounded-xl mb-6">
            <button 
              onClick={() => setRole("SME")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${role === 'SME' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Briefcase className="h-4 w-4" />
              Business
            </button>
            <button 
              onClick={() => setRole("ENTERPRISE")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${role === 'ENTERPRISE' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Building2 className="h-4 w-4" />
              Enterprise
            </button>
            <button 
              onClick={() => setRole("INVESTOR")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${role === 'INVESTOR' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users className="h-4 w-4" />
              Investor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="firstName">First name</label>
                <Input id="firstName" placeholder="John" className="bg-background/50 h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="lastName">Last name</label>
                <Input id="lastName" placeholder="Doe" className="bg-background/50 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required className="bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-background/50 h-10" />
            </div>
            <Button className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white mt-6 transition-all font-bold" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Join as ${role === 'INVESTOR' ? 'Investor' : role === 'ENTERPRISE' ? 'Enterprise' : 'Business'}`}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm border-t border-border/40 pt-6">
          <p className="text-muted-foreground mt-2">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-teal-500 hover:text-teal-600 font-medium hover:underline transition-all">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
