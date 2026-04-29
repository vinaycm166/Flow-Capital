"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity, Landmark, ShieldCheck, TrendingUp, Search, Filter,
  Loader2, X, CreditCard, Building2, AlertCircle, CheckCircle2, Upload, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
  id: string;
  amount: number;
  buyerName?: string;
  buyer?: string;
  dueDate: string;
  status: string;
  tokenPrice?: number;
  totalTokens?: number;
  availableTokens?: number;
  riskScore?: { score: number; category: string };
  investments: any[];
}

type ModalStep = "select" | "neft-details" | "neft-proof" | "success";

export default function InvestorMarketplacePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "upi" | "neft">("wallet");
  const [processing, setProcessing] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("select");

  // NEFT compliance state
  const [neftAgreed, setNeftAgreed] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const fetchMarketplace = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/marketplace", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch marketplace data");
      setInvoices(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarketplace(); }, []);

  const resetModal = () => {
    setSelectedInvoice(null);
    setInvestAmount("");
    setPaymentMethod("wallet");
    setModalStep("select");
    setNeftAgreed(false);
    setUtrNumber("");
    setProofFile(null);
    setPendingTxId(null);
  };

  // Risk score → color based on 0-100 numeric score
  const getRiskBadgeStyle = (score?: number, category?: string) => {
    if (score === undefined) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    if (score >= 70) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (score >= 45) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  const getRiskLabel = (score?: number) => {
    if (score === undefined) return "Unrated";
    if (score >= 70) return "Low Risk";
    if (score >= 45) return "Med Risk";
    return "High Risk";
  };

  const tokenPrice = selectedInvoice?.tokenPrice || 1000;
  const tokensToBuy = Math.max(0, Math.floor(parseFloat(investAmount) || 0));
  const totalCost = tokensToBuy * tokenPrice;

  // ── NEFT pledge handler ──────────────────────────────────────────────
  const handleNeftPledge = async () => {
    if (!selectedInvoice || tokensToBuy < 1 || !neftAgreed) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("flowcapital_token");

      // Register NEFT pledge — creates PENDING_PROOF_UPLOAD transaction + reserves tokens
      const depositRes = await fetch("/api/payment/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: totalCost, method: "NEFT", pendingProof: true }),
      });
      const depositData = await depositRes.json();
      if (!depositRes.ok) throw new Error(depositData.error || "Failed to register pledge");

      // Reserve the tokens
      const investRes = await fetch("/api/payment/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invoiceId: selectedInvoice.id, tokensToBuy }),
      });
      const investData = await investRes.json();
      if (!investRes.ok) throw new Error(investData.error || "Failed to reserve tokens");

      setPendingTxId(depositData.transactionId || depositData.id || "pending");
      setModalStep("neft-proof");
      fetchMarketplace();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ── Proof upload handler ─────────────────────────────────────────────
  const handleProofUpload = async () => {
    if (!utrNumber.trim()) return alert("Please enter your UTR / Reference Number");
    if (!proofFile) return alert("Please attach the bank transfer screenshot or PDF");
    if (!pendingTxId) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/payment/upload-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          transactionId: pendingTxId,
          utrNumber: utrNumber.toUpperCase().trim(),
          proofUrl: "uploaded_" + Date.now() + "_" + proofFile.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalStep("success");
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ── Razorpay / Wallet handler ────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedInvoice || tokensToBuy < 1) return;

    // NEFT goes to dedicated flow
    if (paymentMethod === "neft") {
      setModalStep("neft-details");
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("flowcapital_token");

      if (paymentMethod === "upi") {
        const loaded = await loadRazorpay();
        if (!loaded) { alert("Payment gateway failed to load."); setProcessing(false); return; }

        const orderRes = await fetch("/api/payment/create-razorpay-order", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: totalCost }),
        });
        const order = await orderRes.json();
        if (!orderRes.ok) throw new Error(order.error || "Could not create order");

        const options = {
          key: "rzp_test_SdwRb176sqLQ69",
          amount: order.amount,
          currency: order.currency,
          name: "FlowCapital",
          description: `${tokensToBuy} token(s) in ${selectedInvoice.buyerName || selectedInvoice.buyer}`,
          order_id: order.id,
          handler: async () => {
            await fetch("/api/payment/deposit", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ amount: totalCost, method: "UPI" }),
            });
            const res = await fetch("/api/payment/invest", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ invoiceId: selectedInvoice.id, tokensToBuy }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setModalStep("success");
            fetchMarketplace();
          },
          theme: { color: "#14b8a6" },
          modal: { ondismiss: () => setProcessing(false) },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", () => { alert("Payment failed."); setProcessing(false); });
        rzp.open();
        return;
      }

      // Flow Wallet
      const res = await fetch("/api/payment/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invoiceId: selectedInvoice.id, tokensToBuy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalStep("success");
      fetchMarketplace();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Invoice Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">Discover and fund high-yield tokenized trade receivables.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="glass-card"><Filter className="w-4 h-4 mr-2" />Filter</Button>
          <Button variant="outline" size="sm" className="glass-card"><Search className="w-4 h-4 mr-2" />Search</Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Scanning blockchain for active contracts...</p>
        </div>
      ) : error ? (
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="py-12 text-center text-rose-500">{error}</CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card className="glass-card shadow-xl border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-teal-500/10 flex items-center justify-center mb-8 animate-pulse">
              <Activity className="w-10 h-10 text-teal-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Market Opportunity Awaiting</h2>
            <p className="text-muted-foreground max-w-lg text-lg">
              No active tokenized invoices found. New opportunities are tokenized by SMEs in real-time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
          {invoices.map((invoice) => {
            const buyer = invoice.buyerName || invoice.buyer || "Unknown";
            const daysLeft = Math.max(0, Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / 86400000));
            const filled = invoice.totalTokens && invoice.availableTokens !== undefined
              ? ((invoice.totalTokens - invoice.availableTokens) / invoice.totalTokens) * 100 : 0;
            const score = invoice.riskScore?.score;

            return (
              <Card key={invoice.id} className="group relative glass-card shadow-lg hover:shadow-2xl hover:border-teal-500/50 transition-all duration-300 overflow-hidden border-border/40">
                {/* Risk Score Badge — numeric */}
                <div className="absolute top-0 right-0 p-4">
                  <Badge className={`${getRiskBadgeStyle(score)} font-mono text-xs`}>
                    {score !== undefined ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {score}/100 · {getRiskLabel(score)}
                      </span>
                    ) : "Unrated"}
                  </Badge>
                </div>

                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold tracking-widest uppercase text-teal-500">
                    TOKENIZED ASSET
                  </CardDescription>
                  <CardTitle className="text-xl mt-1 leading-tight pr-24">{buyer}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end border-b border-border/40 pb-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-tight">Pool Size</p>
                      <p className="text-2xl font-black">₹{invoice.amount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-tight">Per Token</p>
                      <p className="text-sm font-semibold text-teal-400">₹{(invoice.tokenPrice || 1000).toLocaleString()}</p>
                    </div>
                  </div>

                  {invoice.totalTokens !== undefined && invoice.availableTokens !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{invoice.availableTokens} tokens available</span>
                        <span>{filled.toFixed(0)}% funded</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${filled}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <TrendingUp className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>{daysLeft} days until maturity</span>
                  </div>

                  <Button
                    onClick={() => { setSelectedInvoice(invoice); setModalStep("select"); }}
                    variant="outline"
                    className="w-full border-teal-500/20 hover:bg-teal-500/10 hover:text-teal-500 transition-colors"
                  >
                    <Landmark className="w-4 h-4 mr-2" /> Invest
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── INVEST MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-md"
            >
              <Card className="glass shadow-2xl border-border overflow-hidden">
                {/* Header */}
                <CardHeader className="border-b border-border/50 bg-muted/30 pb-4 relative">
                  <button onClick={resetModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                  <CardTitle className="text-base pr-8">
                    {modalStep === "select" && "Invest in Invoice"}
                    {modalStep === "neft-details" && "NEFT / RTGS Wire Transfer"}
                    {modalStep === "neft-proof" && "Upload Payment Proof"}
                    {modalStep === "success" && "Investment Confirmed"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedInvoice.buyerName || selectedInvoice.buyer} · Pool ₹{selectedInvoice.amount.toLocaleString()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-5 space-y-4">

                  {/* ── STEP 1: Token qty + method ── */}
                  {modalStep === "select" && (
                    <>
                      {/* Token input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Token Quantity</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">QTY</span>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            placeholder={`e.g. 5  (1 token = ₹${(selectedInvoice.tokenPrice || 1000).toLocaleString()})`}
                            value={investAmount}
                            onChange={(e) => setInvestAmount(e.target.value)}
                            className="pl-14 font-mono bg-background/50"
                          />
                        </div>
                        {tokensToBuy >= 1 && (
                          <p className="text-xs text-teal-500">
                            {tokensToBuy} token{tokensToBuy !== 1 ? "s" : ""} · Total: ₹{totalCost.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Payment method */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "wallet", label: "Flow Wallet", icon: <Landmark className="w-4 h-4" /> },
                            { key: "upi", label: "UPI / Card", icon: <CreditCard className="w-4 h-4" /> },
                            { key: "neft", label: "NEFT / RTGS", icon: <Building2 className="w-4 h-4" /> },
                          ].map(({ key, label, icon }) => (
                            <button
                              key={key}
                              onClick={() => setPaymentMethod(key as any)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                                paymentMethod === key
                                  ? "bg-teal-500/10 border-teal-500/50 text-teal-500"
                                  : "bg-background border-border hover:bg-secondary/50 text-muted-foreground"
                              }`}
                            >
                              {icon}{label}
                            </button>
                          ))}
                        </div>
                        {paymentMethod === "neft" && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
                            <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>You'll get <strong>24 hours</strong> to complete the wire and upload proof. Non-compliance results in a 24-hour account block.</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
                        <Button variant="outline" onClick={resetModal} className="min-w-0">Cancel</Button>
                        <Button
                          className="min-w-0 bg-teal-600 hover:bg-teal-500 text-white"
                          onClick={handleConfirm}
                          disabled={tokensToBuy < 1 || processing}
                        >
                          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (paymentMethod === "neft" ? "Proceed →" : "Confirm")}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* ── STEP 2: NEFT Bank Details + Agreement ── */}
                  {modalStep === "neft-details" && (
                    <>
                      {/* Escrow account card */}
                      <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 space-y-3">
                        <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">FlowCapital Escrow Account</p>
                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-mono text-sm">
                          <span className="text-muted-foreground text-xs">Beneficiary</span>
                          <span className="font-semibold">FlowCapital Escrow Pvt. Ltd.</span>
                          <span className="text-muted-foreground text-xs">Bank</span>
                          <span className="font-semibold">RBL Bank Ltd.</span>
                          <span className="text-muted-foreground text-xs">Account No.</span>
                          <span className="font-semibold tracking-widest">4091 8200 0099 01</span>
                          <span className="text-muted-foreground text-xs">IFSC Code</span>
                          <span className="font-semibold">RATN0VAAPIS</span>
                          <span className="text-muted-foreground text-xs">Branch</span>
                          <span className="font-semibold">Mumbai — BKC</span>
                          <span className="text-muted-foreground text-xs">Transfer Type</span>
                          <span className="font-semibold">NEFT / RTGS</span>
                          <span className="text-muted-foreground text-xs">Amount</span>
                          <span className="font-bold text-teal-400 text-base">₹{totalCost.toLocaleString()}</span>
                          <span className="text-muted-foreground text-xs">Reference</span>
                          <span className="font-semibold text-amber-400">FC-INV-{selectedInvoice.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                          Use the Reference code as the payment narration/remarks in your bank transfer to ensure proper reconciliation.
                        </p>
                      </div>

                      {/* 24hr compliance warning */}
                      <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 space-y-1">
                        <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> 24-Hour Compliance Window
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Once you confirm, your token allocation is reserved for <strong>24 hours</strong>. You must complete the wire transfer and upload proof within this window. <strong className="text-rose-400">Failure will result in a 24-hour suspension from all payment activities on FlowCapital.</strong>
                        </p>
                      </div>

                      {/* Agreement checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={neftAgreed}
                          onChange={(e) => setNeftAgreed(e.target.checked)}
                          className="mt-0.5 accent-teal-500 w-4 h-4 shrink-0"
                        />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          I agree to wire <strong className="text-foreground">₹{totalCost.toLocaleString()}</strong> to the FlowCapital Escrow account and upload proof of transfer within 24 hours. I understand that non-compliance will result in a 24-hour account suspension.
                        </span>
                      </label>

                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
                        <Button variant="outline" onClick={() => setModalStep("select")} className="min-w-0">← Back</Button>
                        <Button
                          className="min-w-0 bg-amber-600 hover:bg-amber-500 text-white"
                          onClick={handleNeftPledge}
                          disabled={!neftAgreed || processing}
                        >
                          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Pledge"}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* ── STEP 3: Upload Proof ── */}
                  {modalStep === "neft-proof" && (
                    <>
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pledge Registered — Tokens Reserved
                        </p>
                        <p className="text-sm text-foreground/80">
                          Complete the wire of <strong>₹{totalCost.toLocaleString()}</strong> and upload your bank receipt below.
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
                          <Clock className="w-3 h-3" />
                          <span>Proof required within <strong>24 hours</strong> from now</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bank UTR / Reference Number</label>
                        <Input
                          placeholder="e.g. AXIR230912345678"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                          className="font-mono bg-background/50 uppercase tracking-widest"
                        />
                        <p className="text-[10px] text-muted-foreground">Find this in your bank's transaction confirmation SMS or email.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Transfer Receipt</label>
                        <label className="flex items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-teal-500/50 hover:bg-teal-500/5 transition-all cursor-pointer text-sm text-muted-foreground">
                          <Upload className="w-5 h-5" />
                          {proofFile ? (
                            <span className="text-teal-400 font-medium truncate max-w-xs">{proofFile.name}</span>
                          ) : (
                            <span>Click to attach screenshot or PDF</span>
                          )}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
                        <Button variant="outline" onClick={resetModal} className="min-w-0 text-muted-foreground">Upload Later</Button>
                        <Button
                          className="min-w-0 bg-teal-600 hover:bg-teal-500 text-white"
                          onClick={handleProofUpload}
                          disabled={processing}
                        >
                          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Proof"}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* ── STEP 4: Success ── */}
                  {modalStep === "success" && (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Investment Confirmed!</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                          {paymentMethod === "neft"
                            ? "Proof submitted for admin review. Tokens will be credited upon verification."
                            : `Your ${tokensToBuy} token${tokensToBuy !== 1 ? "s" : ""} in ${selectedInvoice.buyerName || selectedInvoice.buyer} are secured.`}
                        </p>
                      </div>
                      <Button onClick={resetModal} className="bg-teal-600 hover:bg-teal-500 text-white px-8">
                        Back to Marketplace
                      </Button>
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
