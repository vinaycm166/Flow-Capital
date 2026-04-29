"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, CheckCircle, XCircle, ShieldAlert, Landmark, FileText,
  RefreshCw, Clock, AlertCircle, BadgeCheck, CreditCard, Building2, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PendingDeposit {
  id: string;
  amount: number;
  utrNumber: string | null;
  proofUrl: string | null;
  method: string | null;
  status: string;
  createdAt: string;
  user: { id: string; email: string; name: string };
}

interface PendingInvoice {
  id: string;
  amount: number;
  buyerName: string;
  gstNumber: string | null;
  imageUrl: string | null;
  status: string;
  createdAt: string;
  owner: { id: string; email: string; name: string; companyName: string };
  riskScore?: { score: number; category: string } | null;
}

type Tab = "overview" | "invoices" | "payments";

// ─── Inner component (needs useSearchParams so must be inside Suspense) ───────
function AdminConsoleInner() {
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const t = searchParams?.get("tab");
    return (t === "invoices" || t === "payments") ? t as Tab : "overview";
  })();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDeposits = useCallback(async () => {
    setLoadingDeposits(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/payment/admin/pending-deposits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPendingDeposits(await res.json());
      else console.error("Deposits fetch failed:", res.status);
    } catch (e) { console.error(e); }
    finally { setLoadingDeposits(false); }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/invoices/admin/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPendingInvoices(await res.json());
      else console.error("Invoices fetch failed:", res.status);
    } catch (e) { console.error(e); }
    finally { setLoadingInvoices(false); }
  }, []);

  useEffect(() => {
    fetchDeposits();
    fetchInvoices();
    const interval = setInterval(() => { fetchDeposits(); fetchInvoices(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchDeposits, fetchInvoices]);

  const handleDepositAction = async (txId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`${action} this NEFT transaction?`)) return;
    setProcessingId(txId);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/payment/verify-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId: txId, action }),
      });
      const data = await res.json();
      if (res.ok) { alert(data.message); fetchDeposits(); }
      else alert(data.error || "Action failed");
    } catch { alert("Connection failed"); }
    finally { setProcessingId(null); }
  };

  const handleInvoiceAction = async (invoiceId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`${action} this invoice?`)) return;
    setProcessingId(invoiceId);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/invoices/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invoiceId, action }),
      });
      const data = await res.json();
      if (res.ok) { alert(data.message); fetchInvoices(); }
      else alert(data.error || "Action failed");
    } catch { alert("Connection failed"); }
    finally { setProcessingId(null); }
  };

  const hoursElapsed = (dateStr: string) => {
    // Append 'Z' to force UTC parsing if Supabase returns datetime without timezone
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const diff = Date.now() - new Date(utcDateStr).getTime();
    return Math.max(0, Math.floor(diff / 3600000));
  };

  const totalQueue = pendingDeposits.length + pendingInvoices.length;

  const tabs: { key: Tab; label: string; Icon: any }[] = [
    { key: "overview", label: "Overview", Icon: ShieldAlert },
    { key: "invoices", label: "Invoice Queue", Icon: BadgeCheck },
    { key: "payments", label: "Payment Proofs", Icon: CreditCard },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400 flex items-center gap-3">
            <ShieldAlert className="w-9 h-9 text-rose-500" /> Admin Console
          </h1>
          <p className="text-muted-foreground mt-1">Verification dashboard for GST invoices and NEFT payment proofs.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchDeposits(); fetchInvoices(); }} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Pending Actions", value: totalQueue, Icon: ShieldAlert, color: "text-rose-500 bg-rose-500/10" },
          { label: "Invoice Queue", value: pendingInvoices.length, Icon: BadgeCheck, color: "text-amber-500 bg-amber-500/10" },
          { label: "Payment Proofs Awaiting", value: pendingDeposits.length, Icon: CreditCard, color: "text-blue-500 bg-blue-500/10" },
        ].map(({ label, value, Icon, color }) => (
          <Card key={label} className="glass-card border-border/40">
            <CardContent className="pt-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/40">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key ? "border-rose-500 text-rose-500" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Invoice Queue ─────────────────────────────────────────────────────── */}
      {(tab === "invoices" || tab === "overview") && (
        <div>
          {tab === "overview" && (
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-amber-500" /> Invoice GST Verification Queue
            </h2>
          )}
          {loadingInvoices ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
          ) : pendingInvoices.length === 0 ? (
            <Card className="glass-card border-border/40">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                <p className="font-semibold">No invoices pending verification</p>
                <p className="text-sm text-muted-foreground mt-1">All SME invoices have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {pendingInvoices.map((inv) => (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                    <Card className="glass-card border-amber-500/20 overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-500 to-orange-500" />
                      <CardHeader className="pl-7 pb-2">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-amber-500 mb-1">
                              GST Invoice Pending Review
                            </CardDescription>
                            <CardTitle className="text-xl">{inv.buyerName}</CardTitle>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Building2 className="w-3.5 h-3.5" /> {inv.owner?.companyName || inv.owner?.name}
                              <span className="mx-1 text-muted-foreground/40">·</span>
                              <User className="w-3.5 h-3.5" /> {inv.owner?.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                              <Clock className="w-3 h-3 mr-1" />{hoursElapsed(inv.createdAt)}h ago
                            </Badge>
                            <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-xs">{inv.status}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pl-7 pt-3 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-background/50 rounded-xl border border-border/40">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1">Invoice Amount</p>
                            <p className="text-xl font-black">₹{inv.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1">GST Number</p>
                            <p className="font-mono font-bold text-blue-400">{inv.gstNumber || <span className="text-muted-foreground italic text-xs">Not provided</span>}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1">Invoice Image</p>
                            {inv.imageUrl ? (
                              <a href={inv.imageUrl} download={`invoice-${inv.id}.jpg`} className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> Download Document
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">No image</span>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1">Risk Score</p>
                            <p className="font-mono text-sm">
                              {inv.riskScore ? `${inv.riskScore.score}/100 (${inv.riskScore.category})` : "Evaluated on approval"}
                            </p>
                          </div>
                        </div>
                        {!inv.gstNumber && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>No GST number — manually verify the uploaded invoice image before approving.</span>
                          </div>
                        )}
                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={() => handleInvoiceAction(inv.id, "APPROVE")}
                            disabled={processingId !== null}
                          >
                            {processingId === inv.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <><CheckCircle className="w-4 h-4 mr-2" />Approve</>}
                          </Button>
                          <Button
                            variant="outline"
                            className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-semibold w-1/3"
                            onClick={() => handleInvoiceAction(inv.id, "REJECT")}
                            disabled={processingId !== null}
                          >
                            <XCircle className="w-4 h-4 mr-2" />Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── Payment Proofs ────────────────────────────────────────────────────── */}
      {(tab === "payments" || tab === "overview") && (
        <div>
          {tab === "overview" && (
            <h2 className="text-lg font-bold mt-6 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" /> NEFT / RTGS Payment Verification Queue
            </h2>
          )}
          {loadingDeposits ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : pendingDeposits.length === 0 ? (
            <Card className="glass-card border-border/40">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                <p className="font-semibold">No payments pending verification</p>
                <p className="text-sm text-muted-foreground mt-1">All NEFT / RTGS proofs have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {pendingDeposits.map((tx) => {
                  const elapsed = hoursElapsed(tx.createdAt);
                  const isExpiring = elapsed >= 20;
                  const isExpired = elapsed >= 24;
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                      <Card className={`glass-card overflow-hidden relative ${isExpired ? "border-rose-500/40" : "border-blue-500/20"}`}>
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${isExpired ? "bg-rose-500" : "bg-gradient-to-b from-blue-500 to-teal-500"}`} />
                        <CardHeader className="pl-7 pb-2">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-blue-400 mb-1">
                                {tx.status === "PENDING_PROOF_UPLOAD" ? "Awaiting Investor Proof Upload" : "Proof Submitted — Pending Admin Review"}
                              </CardDescription>
                              <CardTitle className="text-xl">{tx.user?.name}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-0.5">{tx.user?.email}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge className={`text-xs ${isExpired ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : isExpiring ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                                <Clock className="w-3 h-3 mr-1" />
                                {isExpired ? "EXPIRED" : `${elapsed}h elapsed`}
                              </Badge>
                              <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-xs">{tx.method || "NEFT"}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pl-7 pt-3 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background/50 rounded-xl border border-border/40">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1">Transfer Amount</p>
                              <p className="text-2xl font-black">₹{tx.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1 flex items-center gap-1">
                                <Landmark className="w-3 h-3" /> UTR / Reference
                              </p>
                              {tx.utrNumber
                                ? <p className="font-mono font-bold text-lg text-blue-400 select-all">{tx.utrNumber}</p>
                                : <p className="text-sm text-muted-foreground italic">Not yet provided by investor</p>}
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Payment Receipt
                              </p>
                              {tx.proofUrl
                                ? <a href={tx.proofUrl} download={`proof-${tx.id}.jpg`} className="text-sm text-blue-500 hover:underline">Download Proof Document</a>
                                : <p className="text-sm text-amber-400 italic">Investor yet to upload receipt</p>}
                            </div>
                          </div>
                          {isExpired && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-400">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>24-hour compliance window has lapsed. Rejecting will trigger a 24-hour account suspension for this investor.</span>
                            </div>
                          )}
                          {tx.status === "PENDING_PROOF_UPLOAD" && !isExpired && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
                              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Investor pledged payment but has not uploaded proof yet. {24 - elapsed}h remaining before auto-suspension.</span>
                            </div>
                          )}
                          <div className="flex gap-3">
                            <Button
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              onClick={() => handleDepositAction(tx.id, "APPROVE")}
                              disabled={processingId !== null || !tx.utrNumber}
                            >
                              {processingId === tx.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><CheckCircle className="w-4 h-4 mr-2" />Verify &amp; Disburse Funds</>}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-semibold w-1/3"
                              onClick={() => handleDepositAction(tx.id, "REJECT")}
                              disabled={processingId !== null}
                            >
                              <XCircle className="w-4 h-4 mr-2" />Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page export — Suspense required for useSearchParams in App Router ─────────
export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      }
    >
      <AdminConsoleInner />
    </Suspense>
  );
}
