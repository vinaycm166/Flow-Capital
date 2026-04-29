"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  TOKENIZED: "#3b82f6",
  FUNDED: "#8b5cf6",
  SETTLED: "#10b981",
};

const STATUS_BG: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500",
  TOKENIZED: "bg-blue-500/10 text-blue-500",
  FUNDED: "bg-violet-500/10 text-violet-500",
  SETTLED: "bg-emerald-500/10 text-emerald-500",
};

// Custom recharts tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl border border-border/40">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className ?? ""}`} />;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut" } }),
};

export default function SMEAnalyticsPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [coreAnalytics, setCoreAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [invRes, anaRes, coreRes] = await Promise.all([
        fetch("/api/invoices", { headers }),
        fetch("/api/invoices/analytics", { headers }),
        fetch("/api/analytics", { headers }),
      ]);

      if (invRes.ok) setInvoices(await invRes.json());
      if (anaRes.ok) setAnalytics(await anaRes.json());
      if (coreRes.ok) setCoreAnalytics(await coreRes.json());
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --------------- derived data ---------------
  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      map[inv.status] = (map[inv.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const statusAmounts = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      map[inv.status] = (map[inv.status] || 0) + inv.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const totalVolume = useMemo(() => invoices.reduce((a, i) => a + i.amount, 0), [invoices]);
  const settledAmount = useMemo(() => invoices.filter((i) => i.status === "SETTLED").reduce((a, i) => a + i.amount, 0), [invoices]);
  const fundedAmount = useMemo(() => invoices.filter((i) => i.status === "FUNDED" || i.status === "SETTLED").reduce((a, i) => a + i.amount, 0), [invoices]);
  const pendingCount = useMemo(() => invoices.filter((i) => i.status === "PENDING" || i.status === "TOKENIZED").length, [invoices]);
  const avgRisk = useMemo(() => {
    const scored = invoices.filter((i) => i.riskScore);
    return scored.length > 0 ? Math.round(scored.reduce((a, i) => a + i.riskScore.score, 0) / scored.length) : null;
  }, [invoices]);

  const fundingRate = useMemo(() => {
    if (invoices.length === 0) return 0;
    return Math.round((invoices.filter((i) => i.status === "FUNDED" || i.status === "SETTLED").length / invoices.length) * 100);
  }, [invoices]);

  const trendData = analytics?.trendData ?? [];

  // monthly invoice volume from actual dates
  const monthlyVolume = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      map[key] = (map[key] || 0) + inv.amount;
    });
    return Object.entries(map)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6);
  }, [invoices]);

  // --------------- loading state ---------------
  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto w-full">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PieChartIcon className="h-7 w-7 text-blue-500" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Deep insights on your invoices, funding & risk.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchAll(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* -------- KPI Cards -------- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Volume",
            value: `₹${totalVolume.toLocaleString()}`,
            sub: `${invoices.length} invoices`,
            icon: DollarSign,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            trend: null,
          },
          {
            title: "Funded Capital",
            value: `₹${fundedAmount.toLocaleString()}`,
            sub: `${fundingRate}% funding rate`,
            icon: TrendingUp,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            trend: fundingRate > 50 ? "up" : "down",
          },
          {
            title: "Pending Invoices",
            value: pendingCount,
            sub: `awaiting funding`,
            icon: Clock,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            trend: null,
          },
          {
            title: "Avg Risk Score",
            value: avgRisk !== null ? avgRisk : "N/A",
            sub: avgRisk !== null ? (avgRisk < 40 ? "Low risk" : avgRisk < 70 ? "Medium risk" : "High risk") : "No data",
            icon: AlertCircle,
            color: avgRisk !== null && avgRisk < 40 ? "text-emerald-500" : avgRisk !== null && avgRisk < 70 ? "text-orange-500" : "text-red-500",
            bgColor: avgRisk !== null && avgRisk < 40 ? "bg-emerald-500/10" : avgRisk !== null && avgRisk < 70 ? "bg-orange-500/10" : "bg-red-500/10",
            trend: null,
          },
        ].map((kpi, i) => (
          <motion.div key={kpi.title} custom={i} variants={fadeUp} initial="hidden" animate="show">
            <Card className="glass-card hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <div className={`w-9 h-9 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono flex items-center gap-2">
                  {kpi.value}
                  {kpi.trend === "up" && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                  {kpi.trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-400" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* -------- Charts Row -------- */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Status Distribution — Pie */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="h-4 w-4 text-blue-500" /> Invoice Status
              </CardTitle>
              <CardDescription>Distribution of all invoices by status</CardDescription>
            </CardHeader>
            <CardContent>
              {statusCounts.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No invoices yet</div>
              ) : (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                        {statusCounts.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#64748b"} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl border border-border/40">
                              <span className="font-semibold">{d.name}</span>: {d.value} invoice{d.value > 1 ? "s" : ""}
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {statusCounts.map((s) => (
                      <Badge key={s.name} variant="secondary" className={`${STATUS_BG[s.name] ?? ""} gap-1.5 text-xs`}>
                        <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.name] ?? "#64748b" }} />
                        {s.name} ({s.value})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Funding Trends — Area */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-500" /> Funding Trends
              </CardTitle>
              <CardDescription>Monthly funded vs pending capital</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No trend data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fundedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="funded" name="Funded" stroke="#3b82f6" fill="url(#fundedGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="url(#pendingGrad)" strokeWidth={2} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* -------- Volume by Status — Horizontal Bars -------- */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-violet-500" /> Volume by Status
            </CardTitle>
            <CardDescription>Capital distribution across invoice statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {statusAmounts.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusAmounts} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} stroke="hsl(var(--muted-foreground))" width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Amount" radius={[0, 6, 6, 0]} barSize={28}>
                    {statusAmounts.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#64748b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* -------- Invoice Volume Over Time — Bar -------- */}
      {monthlyVolume.length > 0 && (
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-emerald-500" /> Monthly Invoice Volume
              </CardTitle>
              <CardDescription>Actual invoice amounts aggregated by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyVolume} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" name="Volume" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* -------- Invoice Breakdown Table -------- */}
      <motion.div custom={8} variants={fadeUp} initial="hidden" animate="show">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-blue-500" /> Invoice Breakdown
            </CardTitle>
            <CardDescription>All invoices with risk scores and status</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {invoices.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                No invoices found. Upload your first invoice to see analytics.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Buyer</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Risk</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 font-medium">{inv.buyer}</td>
                      <td className="py-3 font-mono">₹{inv.amount.toLocaleString()}</td>
                      <td className="py-3 text-muted-foreground">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3">
                        {inv.riskScore ? (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              inv.riskScore.score < 40
                                ? "bg-emerald-500/10 text-emerald-500"
                                : inv.riskScore.score < 70
                                ? "bg-orange-500/10 text-orange-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {inv.riskScore.score} — {inv.riskScore.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className={`${STATUS_BG[inv.status] ?? ""} text-xs`}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
