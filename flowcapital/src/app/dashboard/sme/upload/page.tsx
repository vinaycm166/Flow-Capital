"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud, File, X, CheckCircle2, Loader2, Sparkles,
  Coins, AlertCircle, ScanLine, Building2, Search, Mail, ChevronDown, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type ScanState = "idle" | "scanning" | "done" | "failed";

interface Enterprise {
  id: string;
  name: string | null;
  companyName: string | null;
  email: string;
  kycStatus: boolean;
}

export default function UploadInvoice() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [finalRiskScore, setFinalRiskScore] = useState<{score: number, category: string} | null>(null);

  // Form fields
  const [selectedCorporate, setSelectedCorporate] = useState<Enterprise | null>(null);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [smeGstNumber, setSmeGstNumber] = useState("");

  // Corporate selector state
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [enterprisesLoading, setEnterprisesLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  // OCR state
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedAmount, setDetectedAmount] = useState<number | null>(null);
  const [projectedTokens, setProjectedTokens] = useState<number | null>(null);
  const [scanMessage, setScanMessage] = useState("");

  // Today's date string for min date validation
  const todayStr = new Date().toISOString().split("T")[0];

  // ── Load enterprises on mount ──────────────────────────────────────────────
  useEffect(() => {
    const loadEnterprises = async () => {
      try {
        const token = localStorage.getItem("flowcapital_token");
        const res = await fetch("/api/user/enterprises", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEnterprises(data);
        }
      } catch {
        // silently fail
      } finally {
        setEnterprisesLoading(false);
      }
    };
    loadEnterprises();
  }, []);

  const filteredEnterprises = enterprises.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.companyName?.toLowerCase().includes(q) ||
      e.name?.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  // ── File selection & auto-scan ─────────────────────────────────────────────
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setDetectedAmount(null);
    setProjectedTokens(null);
    setScanState("scanning");
    setScanProgress(0);
    setScanMessage("Reading invoice...");

    const progressInterval = setInterval(() => {
      setScanProgress((p) => Math.min(p + 12, 88));
    }, 400);

    try {
      const token = localStorage.getItem("flowcapital_token");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/invoices/scan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.detectedAmount) {
          setDetectedAmount(data.detectedAmount);
          setProjectedTokens(data.tokenCount);
          setAmount(data.detectedAmount.toString());
          if (data.gstNumber) setSmeGstNumber(data.gstNumber);
          setScanState("done");
          setScanMessage(data.message);
        } else {
          if (data.gstNumber) setSmeGstNumber(data.gstNumber);
          setScanState("failed");
          setScanMessage("Could not auto-detect amount — please enter manually.");
        }
      } else {
        setScanState("failed");
        setScanMessage("Scan failed — please enter amount manually.");
      }
    } catch {
      clearInterval(progressInterval);
      setScanState("failed");
      setScanMessage("Scan error — please enter amount manually.");
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCorporate || !amount || !dueDate) return;
    setSubmitting(true);
    setSubmitError("");

    // Client-side past date guard
    if (dueDate < todayStr) {
      setSubmitError("Due date cannot be in the past. Please select a future date.");
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("flowcapital_token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("buyerName", selectedCorporate.companyName || selectedCorporate.name || selectedCorporate.email);
      formData.append("buyerId", selectedCorporate.id);
      formData.append("dueDate", dueDate);
      formData.append("manualAmount", amount);
      formData.append("smeGstNumber", smeGstNumber);

      const res = await fetch("/api/invoices/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFinalRiskScore({
          score: data.riskScore,
          category: data.riskCategory
        });
        setSubmitted(true);
      } else {
        const err = await res.json();
        setSubmitError(err.error || "Failed to submit invoice. Please try again.");
      }
    } catch {
      setSubmitError("Server connection failed. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Invite corporate ───────────────────────────────────────────────────────
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/user/invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail, invoiceNote: inviteNote }),
      });

      const data = await res.json();
      if (res.ok) {
        setInviteSuccess(data.message);
        setInviteEmail("");
        setInviteNote("");
      } else {
        setInviteError(data.error || "Failed to send invitation.");
      }
    } catch {
      setInviteError("Could not send invite. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Invoice Submitted!</h2>
        <p className="text-muted-foreground mb-2 text-lg">
          ₹{parseFloat(amount).toLocaleString()} · {selectedCorporate?.companyName}
        </p>
        {finalRiskScore && finalRiskScore.score > 0 && (
          <div className={`flex items-center gap-2 mb-4 border rounded-xl px-5 py-3 ${
            finalRiskScore.score >= 80 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
            finalRiskScore.score >= 50 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
            "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
          }`}>
            <ScanLine className="w-5 h-5" />
            <span className="font-semibold">
              Live GST Risk Assessed: {finalRiskScore.score}/100 ({finalRiskScore.category})
            </span>
          </div>
        )}
        {projectedTokens && (
          <div className="flex items-center gap-2 mb-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-3">
            <Coins className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-indigo-300">
              {projectedTokens.toLocaleString()} tokens will be generated at ₹1,000 each
            </span>
          </div>
        )}
        <p className="text-muted-foreground text-sm mb-8 max-w-md">
          The invoice is now awaiting verification from <strong>{selectedCorporate?.companyName}</strong>.
          Once they accept, tokens will appear on the investor marketplace in real-time.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard/sme">
            <Button variant="outline" className="glass">Return to Dashboard</Button>
          </Link>
          <Button
            onClick={() => {
              setSubmitted(false); setFile(null); setSelectedCorporate(null);
              setAmount(""); setDueDate(""); setDetectedAmount(null);
              setProjectedTokens(null); setScanState("idle"); setSubmitError("");
              setSmeGstNumber(""); setFinalRiskScore(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Upload Another
          </Button>
        </div>
      </motion.div>
    );
  }

  const tokenPreview = amount ? parseFloat(amount) / 1000 : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Invoice</h1>
        <p className="text-muted-foreground mt-1">
          AI automatically detects the invoice amount and generates tokens (amount ÷ 1,000).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── File Upload Zone ──────────────────────────────────────────── */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-blue-400" />
              Invoice Document
            </CardTitle>
            <CardDescription>
              Upload PDF or image — our AI will auto-detect the total amount.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200 text-center cursor-pointer ${
                dragActive
                  ? "border-blue-500 bg-blue-500/5 scale-[1.01]"
                  : "border-border/50 hover:bg-secondary/50 hover:border-border"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.webp"
              />
              {!file ? (
                <>
                  <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Drag and drop your invoice</h3>
                  <p className="text-sm text-muted-foreground mb-4">PDF, JPG, PNG, WebP — up to 10 MB</p>
                  <Button type="button" variant="secondary" size="sm">Select File</Button>
                </>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-3">
                    <File className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{file.name}</h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null); setScanState("idle"); setDetectedAmount(null);
                        setProjectedTokens(null); setAmount(""); setSmeGstNumber("");
                      }}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>

            {/* OCR Progress / Result */}
            <AnimatePresence mode="wait">
              {scanState === "scanning" && (
                <motion.div key="scanning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-2 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI scanning invoice...
                  </div>
                  <Progress value={scanProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{scanMessage}</p>
                </motion.div>
              )}
              {scanState === "done" && detectedAmount && (
                <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-400">
                    <Sparkles className="w-4 h-4" /> Amount Auto-Detected!
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-2 bg-background/50 border border-border/40 rounded-lg px-3 py-1.5">
                      <span className="text-muted-foreground">Invoice Total:</span>
                      <span className="font-bold font-mono text-foreground">₹{detectedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
                      <Coins className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-blue-400">{projectedTokens?.toLocaleString()} tokens × ₹1,000</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">You can adjust the amount below if needed.</p>
                </motion.div>
              )}
              {scanState === "failed" && (
                <motion.div key="failed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Manual entry required</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{scanMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ── Invoice Details ──────────────────────────────────────────────── */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              {scanState === "done"
                ? "Amount pre-filled from AI scan — confirm or adjust below."
                : "Fill in the invoice details below."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* ── Corporate Selector ─────────────────────────────────────── */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Corporate Buyer
                <span className="text-red-400">*</span>
              </label>

              {/* Selected corporate badge */}
              {selectedCorporate ? (
                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm">{selectedCorporate.companyName}</p>
                    <p className="text-xs text-muted-foreground">{selectedCorporate.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCorporate.kycStatus && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">KYC Verified</Badge>
                    )}
                    <button type="button" onClick={() => setSelectedCorporate(null)}
                      className="text-muted-foreground hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Search input */}
                  <div
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background/50 cursor-pointer focus-within:border-blue-500/50"
                    onClick={() => setDropdownOpen(true)}
                  >
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search registered corporates..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setDropdownOpen(true); }}
                      onFocus={() => setDropdownOpen(true)}
                      className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                    />
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  {/* Dropdown list */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 mt-1 w-full bg-background/95 backdrop-blur-3xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
                      >
                        {enterprisesLoading ? (
                          <div className="flex items-center gap-2 p-4 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading registered corporates...
                          </div>
                        ) : filteredEnterprises.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            {searchQuery ? `No corporate found matching "${searchQuery}"` : "No corporates registered yet."}
                          </div>
                        ) : (
                          <div className="max-h-52 overflow-y-auto">
                            {filteredEnterprises.map((ent) => (
                              <button
                                key={ent.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCorporate(ent);
                                  setDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <div>
                                  <p className="font-medium text-sm">{ent.companyName || ent.name}</p>
                                  <p className="text-xs text-muted-foreground">{ent.email}</p>
                                </div>
                                {ent.kycStatus && (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">KYC ✓</Badge>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Invite option always shown at bottom */}
                        <div className="border-t border-border/40 p-2">
                          <button
                            type="button"
                            onClick={() => { setDropdownOpen(false); setShowInvite(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <UserPlus className="w-4 h-4" />
                            Corporate not listed? Invite them via email
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Backdrop to close dropdown */}
                  {dropdownOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Only registered FlowCapital Corporates are shown. Tokens are generated only after their acceptance.
              </p>
            </div>

            {/* Amount, GST + Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  My GSTIN
                  {scanState === "done" && smeGstNumber && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Auto-detected</Badge>
                  )}
                </label>
                <Input
                  type="text"
                  placeholder="29ABCDE1234F1Z5"
                  value={smeGstNumber}
                  onChange={(e) => setSmeGstNumber(e.target.value.toUpperCase())}
                  required
                  maxLength={15}
                  className={`bg-background/50 font-mono ${scanState === "done" && smeGstNumber ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Invoice Amount (₹)
                  {scanState === "done" && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Auto-detected</Badge>
                  )}
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1000"
                  step="any"
                  className={`bg-background/50 font-mono ${scanState === "done" ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  required
                  value={dueDate}
                  min={todayStr}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-background/50 text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Past dates are not accepted.</p>
              </div>
            </div>

            {/* Error message */}
            {submitError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{submitError}</p>
              </motion.div>
            )}

            {/* Live token preview */}
            <AnimatePresence>
              {tokenPreview !== null && tokenPreview > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-xl">
                    <p className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                      <Coins className="w-4 h-4" /> Token Preview
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-black text-foreground">{tokenPreview.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Tokens</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-blue-400">₹1,000</p>
                        <p className="text-xs text-muted-foreground">Per Token</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-emerald-400">₹{(tokenPreview * 1000).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Value</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Tokens generated after Corporate acceptance • Available on Investor Marketplace instantly
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/sme">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={!file || !selectedCorporate || !amount || !dueDate || submitting || scanState === "scanning"}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[160px] gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><UploadCloud className="w-4 h-4" /> Upload Invoice</>
            )}
          </Button>
        </div>
      </form>

      {/* ── Invite Corporate Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showInvite && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowInvite(false); setInviteSuccess(""); setInviteError(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="glass-card border border-border/50 rounded-2xl p-6 w-full max-w-md pointer-events-auto shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Invite Corporate</h3>
                    <p className="text-xs text-muted-foreground">They'll receive a link to join FlowCapital</p>
                  </div>
                  <button type="button" onClick={() => { setShowInvite(false); setInviteSuccess(""); setInviteError(""); }}
                    className="ml-auto text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {inviteSuccess ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-6 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="font-semibold text-emerald-400">Invitation Sent!</p>
                    <p className="text-sm text-muted-foreground">{inviteSuccess}</p>
                    <Button variant="outline" onClick={() => { setShowInvite(false); setInviteSuccess(""); }} className="mt-2">Close</Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Corporate Email Address</label>
                      <Input
                        type="email"
                        placeholder="finance@corporation.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message / Invoice Note (optional)</label>
                      <textarea
                        placeholder="e.g. We have a ₹5L invoice from your order #2024-089..."
                        value={inviteNote}
                        onChange={(e) => setInviteNote(e.target.value)}
                        className="flex min-h-[80px] w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    {inviteError && (
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {inviteError}
                      </p>
                    )}
                    <div className="flex gap-3 pt-1">
                      <Button type="button" variant="outline" onClick={() => setShowInvite(false)} className="flex-1">Cancel</Button>
                      <Button type="submit" disabled={inviting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Mail className="w-4 h-4" /> Send Invite</>}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
