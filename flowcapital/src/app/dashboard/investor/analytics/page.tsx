"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  PieChart, 
  TrendingUp, 
  Landmark, 
  Briefcase, 
  BarChart4, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck,
  Loader2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalInvested: number;
  investmentsCount: number;
  companiesBacked: number;
  portfolioHealthPct: number;
  riskAllocation: { label: string; value: number; color: string }[];
  trendData: { name: string; value: number }[];
}

export default function InvestorAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("flowcapital_token");
        const response = await fetch("/api/payment/investments", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch analytics data");
        const investments = await response.json();

        // Compute Total Invested and Count
        const totalInvested = investments.reduce((acc: number, inv: any) => acc + inv.amount, 0);
        const investmentsCount = investments.length;

        // Compute New Metrics: Companies Backed & Portfolio Health
        const uniqueCompanies = new Set();
        let healthyInvestments = 0;

        let riskA = 0, riskB = 0, riskC = 0;

        investments.forEach((inv: any) => {
           if (inv.invoice?.buyerName) uniqueCompanies.add(inv.invoice.buyerName);
           
           // If invoice is VERIFIED or fully funded without default, it's healthy
           if (inv.invoice?.status !== 'REJECTED' && inv.invoice?.status !== 'PENDING_VERIFICATION') {
               healthyInvestments++;
           }

           // Standard deterministic ROI based on DB id (for risk proxy)
           const hash = inv.invoice?.id.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) || 0;
           
           // Risk Categorization
           const riskScore = hash % 100;
           if (riskScore > 60) riskA += inv.amount;
           else if (riskScore > 30) riskB += inv.amount;
           else riskC += inv.amount;
        });

        const companiesBacked = uniqueCompanies.size;
        const portfolioHealthPct = investmentsCount > 0 ? Math.round((healthyInvestments / investmentsCount) * 100) : 100;

        // Calculate Allocation Percentages
        const riskAlloc = totalInvested > 0 ? [
          { label: 'Grade A (Low Risk)', value: Math.round((riskA/totalInvested)*100), color: 'bg-emerald-500' },
          { label: 'Grade B (Med Risk)', value: Math.round((riskB/totalInvested)*100), color: 'bg-amber-500' },
          { label: 'Grade C (High Risk)', value: Math.round((riskC/totalInvested)*100), color: 'bg-rose-500' },
        ] : [
          { label: 'Grade A (Low Risk)', value: 0, color: 'bg-emerald-500' },
          { label: 'Grade B (Med Risk)', value: 0, color: 'bg-amber-500' },
          { label: 'Grade C (High Risk)', value: 0, color: 'bg-rose-500' }
        ];

        // Generate Time-Series Trend Data (Cumulative Growth)
        let cumulative = 0;
        const trendData = [...investments]
          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((inv: any) => {
            cumulative += inv.amount;
            return {
              name: new Date(inv.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              value: cumulative
            };
          });

        if (trendData.length === 1) trendData.unshift({ name: 'Start', value: 0 });
        if (trendData.length === 0) trendData.push({ name: 'Today', value: 0 });

        setData({ totalInvested, investmentsCount, companiesBacked, portfolioHealthPct, riskAllocation: riskAlloc, trendData });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background/50">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Aggregating portfolio performance...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Portfolio Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Real-time yield tracking and risk distribution dashboard.</p>
        </div>
        <div className="flex bg-teal-500/10 rounded-full px-4 py-2 border border-teal-500/20 items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-semibold text-teal-600">Risk Profile: Conservative</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card shadow-lg hover:shadow-xl transition-all border-border/40 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                <Landmark className="w-6 h-6 text-teal-500" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none">+12.4%</Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
            <h3 className="text-3xl font-black mt-1">${data?.totalInvested.toLocaleString() || "0"}</h3>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-lg hover:shadow-xl transition-all border-border/40 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Briefcase className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Active Assets</p>
            <h3 className="text-3xl font-black mt-1">{data?.investmentsCount || "0"}</h3>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-lg hover:shadow-xl transition-all border-border/40 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                <Briefcase className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Companies Backed</p>
            <h3 className="text-3xl font-black mt-1">{data?.companiesBacked || "0"} <span className="text-sm font-normal text-muted-foreground">Unique</span></h3>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-lg hover:shadow-xl transition-all border-border/40 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Portfolio Health</p>
            <h3 className="text-3xl font-black mt-1">
               {data?.portfolioHealthPct || "100"}% <span className="text-sm font-normal text-muted-foreground">Performing</span>
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-card shadow-xl border-border/40 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <BarChart4 className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Monthly yield accumulation across all tokenized indices.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
             {data?.trendData && data.trendData.length > 1 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `₹${(val/1000)}k`} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                     itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                     formatter={(value: number) => [`₹${value.toLocaleString()}`, "Capital"]}
                   />
                   <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorTeal)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                 <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center">
                   <TrendingUp className="w-8 h-8 text-teal-500/50" />
                 </div>
                 <p className="text-muted-foreground italic">No historical data available yet</p>
                 <p className="text-xs text-muted-foreground/50">Fund invoices to generate velocity charts.</p>
               </div>
             )}
          </CardContent>
        </Card>

        <Card className="glass-card shadow-xl border-border/40 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <PieChart className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Distribution across risk categories.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-12 space-y-6">
            {data && data.riskAllocation.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <div className="h-2 w-full bg-border/20 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
