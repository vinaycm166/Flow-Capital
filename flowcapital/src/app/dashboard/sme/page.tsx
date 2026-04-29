"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, CheckCircle2, Clock, AlertCircle, TrendingUp, DollarSign, Activity, Trash2, Wifi } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PENDING_VERIFICATION: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    ACCEPTED:             "bg-blue-500/10 text-blue-500 border-blue-500/20",
    TOKENIZED:            "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    FUNDED:               "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    SETTLED:              "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${variants[status] ?? "bg-secondary/50 text-muted-foreground"}`}>
      {status === "PENDING_VERIFICATION" ? "Pending" : status.replace("_", " ")}
    </Badge>
  );
}

export default function SMEDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("flowcapital_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [invRes, transRes, anaRes] = await Promise.all([
        fetch("/api/invoices", { headers }),
        fetch("/api/payment/transactions", { headers }),
        fetch("/api/invoices/analytics", { headers })
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
      if (anaRes.ok) setAnalytics(await anaRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Real-time Socket listeners ────────────────────────────────────────────
  useEffect(() => {
    fetchData();
    const socket = getSocket();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Invoice was accepted by an enterprise — update status instantly
    socket.on("invoice_accepted", (updatedInvoice: any) => {
      setInvoices(prev => prev.map(inv =>
        inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv
      ));
      showToast(`🎉 Invoice for ${updatedInvoice.buyer} was accepted! Tokens created.`);
    });

    // Tokens purchased — one of your invoices moved closer to FUNDED
    socket.on("tokens_purchased", ({ invoiceId, updatedInvoice }: any) => {
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, ...updatedInvoice } : inv
      ));
    });

    // Fully funded — celebrate!
    socket.on("invoice_fully_funded", ({ invoiceId, invoice }: any) => {
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, ...invoice } : inv
      ));
      showToast(`💰 Invoice fully funded!`);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("invoice_accepted");
      socket.off("tokens_purchased");
      socket.off("invoice_fully_funded");
    };
  }, [fetchData]);

  const handleTokenize = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch(`/api/invoices/${invoiceId}/tokenize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, ...updated } : inv));
      } else {
        const error = await res.json();
        alert(error.error || "Tokenization failed");
      }
    } catch {
      alert("Connection error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this invoice?")) return;
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setInvoices(invoices.filter(i => i.id !== id));
      else alert("Failed to delete invoice");
    } catch { alert("Connection error"); }
  };

  const stats = {
    totalPaid:     invoices.filter(i => i.status === "SETTLED").reduce((acc, i) => acc + i.amount, 0),
    pendingAmount: invoices.filter(i => ["PENDING_VERIFICATION", "TOKENIZED"].includes(i.status)).reduce((acc, i) => acc + i.amount, 0),
    pendingCount:  invoices.filter(i => ["PENDING_VERIFICATION", "TOKENIZED"].includes(i.status)).length,
    fundedAmount:  invoices.filter(i => ["FUNDED", "SETTLED"].includes(i.status)).reduce((acc, i) => acc + i.amount, 0),
    avgRiskScore:  analytics?.avgRisk ?? (
      invoices.filter(i => i.riskScore).length > 0
        ? Math.round(invoices.filter(i => i.riskScore).reduce((acc, i) => acc + i.riskScore.score, 0) / invoices.filter(i => i.riskScore).length)
        : null
    )
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -30, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl bg-blue-500/20 border border-blue-500/30 text-blue-300 backdrop-blur-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">Manage your liquidity and track invoice lifecycle.</p>
            <div className={`flex items-center gap-1 text-xs font-medium ${connected ? "text-emerald-400" : "text-red-400"}`}>
              <Wifi className="w-3 h-3" />
              {connected ? "Live" : "Offline"}
            </div>
          </div>
        </div>
        <Link href="/dashboard/sme/upload">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 gap-2">
            <UploadCloud className="h-4 w-4" />
            Upload New Invoice
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Settled Capital</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">₹{stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for withdrawal</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">₹{stats.pendingAmount.toLocaleString()} awaiting funding</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Funded</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{stats.fundedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total liquidity received</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Risk Rating</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgRiskScore != null && !isNaN(stats.avgRiskScore) ? Math.round(stats.avgRiskScore) : "N/A"}</div>
            <Progress value={stats.avgRiskScore || 0} className="h-2 mt-2 bg-secondary" />
            <p className="text-xs text-muted-foreground mt-2">Overall credit worthiness</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Invoice table */}
        <Card className="col-span-full xl:col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Live status — updates in real-time as enterprises verify.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">No invoices found. Upload one to get started.</TableCell></TableRow>
                ) : invoices.map((inv) => (
                  <motion.tr
                    key={inv.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-border/40 hover:bg-secondary/20 transition-colors group"
                  >
                    <TableCell className="font-medium">{inv.buyer}</TableCell>
                    <TableCell>₹{inv.amount.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-3">
                      {inv.status === "ACCEPTED" && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-xs" onClick={() => handleTokenize(inv.id)}>
                          Tokenize
                        </Button>
                      )}
                      <button onClick={() => handleDelete(inv.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Funding Trends */}
        <Card className="col-span-full xl:col-span-3 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Funding Trends
            </CardTitle>
            <CardDescription>Volume and liquidity movements.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.trendData ? analytics.trendData.map((d: any) => (
                <div key={d.month} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{d.month}</span>
                    <span className="text-muted-foreground">₹{(d.funded / 1000).toFixed(1)}k / ₹{(d.pending / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500" style={{ width: `${(d.funded / (d.funded + d.pending)) * 100}%` }} />
                    <div className="h-full bg-blue-500/30" style={{ width: `${(d.pending / (d.funded + d.pending)) * 100}%` }} />
                  </div>
                </div>
              )) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm italic">Analytics loading...</div>
              )}
              <div className="pt-2 flex gap-4 text-[10px] uppercase font-bold tracking-wider">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Funded</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500/30 rounded-full" /> Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Global Transaction History</CardTitle>
          <CardDescription>Financial record of all protocol interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/40">
                <TableHead>Event</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24">No transactions found.</TableCell></TableRow>
              ) : transactions.map((tx) => (
                <TableRow key={tx.id} className="border-border/40">
                  <TableCell className="font-semibold capitalize">{tx.type.toLowerCase()}</TableCell>
                  <TableCell className={tx.type === "DEPOSIT" || tx.type === "SETTLEMENT" ? "text-emerald-500" : "text-red-400"}>
                    {tx.type === "DEPOSIT" || tx.type === "SETTLEMENT" ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/20 bg-emerald-500/5 text-emerald-500">{tx.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
