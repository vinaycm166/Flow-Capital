"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Activity, Percent, ArrowUpRight, BarChart3, Wallet, Clock, Search, Briefcase, CheckCircle2, Loader2, Coins, Wifi, Download, Zap, Link as LinkIcon, Building2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";

export default function InvestorDashboard() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [tokensToBuy, setTokensToBuy] = useState("");
  const [success, setSuccess] = useState(false);
  const [marketplace, setMarketplace] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [walletAction, setWalletAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [walletProcessing, setWalletProcessing] = useState(false);
  const [investing, setInvesting] = useState(false);
  const [settlementIntent, setSettlementIntent] = useState<{ cost: number, tokens: number } | null>(null);
  const [connected, setConnected] = useState(false);
  const [newInvoiceAlert, setNewInvoiceAlert] = useState<string | null>(null);
  const [purchaseFlash, setPurchaseFlash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real Razorpay Loader
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Get userId from token for payment_success
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("flowcapital_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userIdRef.current = payload.userId;
      } catch { }
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("flowcapital_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [invRes, walRes, myInvRes, transRes] = await Promise.all([
        fetch("/api/invoices", { headers }),
        fetch("/api/auth/wallet", { headers }),
        fetch("/api/payment/investments", { headers }),
        fetch("/api/payment/transactions", { headers })
      ]);
      if (invRes.ok) setMarketplace(await invRes.json());
      if (walRes.ok) setWallet(await walRes.json());
      if (myInvRes.ok) setMyInvestments(await myInvRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const token = localStorage.getItem("flowcapital_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [walRes, myInvRes, transRes] = await Promise.all([
        fetch("/api/auth/wallet", { headers }),
        fetch("/api/payment/investments", { headers }),
        fetch("/api/payment/transactions", { headers })
      ]);
      if (walRes.ok) setWallet(await walRes.json());
      if (myInvRes.ok) setMyInvestments(await myInvRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
    } catch (err) { console.error(err); }
  }, []);

  // ── Real-time Socket listeners ────────────────────────────────────────────
  useEffect(() => {
    fetchData();
    const socket = getSocket();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // New invoice accepted by enterprise → push to marketplace instantly
    socket.on("tokens_created", ({ invoice }: any) => {
      setMarketplace(prev => {
        if (prev.find(i => i.id === invoice.id)) {
          return prev.map(i => i.id === invoice.id ? { ...i, ...invoice } : i);
        }
        return [invoice, ...prev];
      });
      setNewInvoiceAlert(`🚀 New opportunity: ${invoice.buyer} — ${invoice.totalTokens} tokens at ₹${invoice.tokenPrice}`);
      setTimeout(() => setNewInvoiceAlert(null), 5000);
    });

    // Someone bought tokens → update ALL investor progress bars instantly
    socket.on("tokens_purchased", ({ invoiceId, updatedInvoice, buyerId }: any) => {
      setMarketplace(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, ...updatedInvoice } : inv
      ));
      // Also update modal if open
      setSelectedInvoice((prev: any) =>
        prev && prev.id === invoiceId ? { ...prev, ...updatedInvoice } : prev
      );
      if (buyerId !== userIdRef.current) {
        setPurchaseFlash(`⚡ Someone just bought tokens on ${updatedInvoice.buyer}`);
        setTimeout(() => setPurchaseFlash(null), 3000);
      }
    });

    // My own payment confirmed → refresh portfolio
    socket.on("payment_success", ({ investorId }: any) => {
      if (investorId === userIdRef.current) {
        fetchPortfolio();
      }
    });

    // Invoice fully funded → update badge
    socket.on("invoice_fully_funded", ({ invoiceId, invoice }: any) => {
      setMarketplace(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, ...invoice } : inv
      ));
    });

    // Wallet updated (after deposit)
    socket.on("wallet_updated", ({ userId, balance }: any) => {
      if (userId === userIdRef.current) {
        setWallet((prev: any) => ({ ...prev, balance }));
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("tokens_created");
      socket.off("tokens_purchased");
      socket.off("payment_success");
      socket.off("invoice_fully_funded");
      socket.off("wallet_updated");
    };
  }, [fetchData, fetchPortfolio]);

  const handleWalletAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAction || !walletAmount) return;
    
    const amt = parseFloat(walletAmount);
    if (walletAction === 'deposit' && amt > 100000 && (!utrNumber || !proofUrl)) {
      alert("UTR Number and Payment Proof are explicitly required for Virtual Escrow wire transfers over ₹1,00,000.");
      return;
    }

    if (walletAction === 'deposit' && amt <= 100000) {
      setWalletProcessing(true);
      const res = await loadRazorpay();
      if (!res) { alert("Failed to load payment gateway"); setWalletProcessing(false); return; }

      try {
        const token = localStorage.getItem("flowcapital_token");
        const orderRes = await fetch('/api/payment/create-razorpay-order', {
          method: 'POST',
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: amt })
        });
        const order = await orderRes.json();

        const options = {
          key: "rzp_test_SdwRb176sqLQ69",
          amount: order.amount,
          currency: order.currency,
          name: "FlowCapital Liquidity",
          description: "Wallet Deposit",
          order_id: order.id,
          handler: function (response: any) {
            executeWalletAction();
          },
          prefill: { name: "Investor", email: "investor@flowcapital.com" },
          theme: { color: "#3399cc" }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', () => alert("Payment failed"));
        rzp.open();
      } catch (err) {
        console.error(err);
      } finally {
        setWalletProcessing(false);
      }
      return; 
    }

    executeWalletAction(); 
  };

  const executeWalletAction = async () => {
    const amt = parseFloat(walletAmount);
    setWalletProcessing(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch(`/api/payment/${walletAction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          amount: amt,
          utrNumber: walletAction === 'deposit' ? utrNumber : undefined,
          proofUrl: walletAction === 'deposit' ? proofUrl : undefined,
          method: amt > 100000 ? 'NEFT' : 'UPI'
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.status === 'PENDING_VERIFICATION') {
          alert("Escrow wire flagged for verification! Admins will approve this shortly.");
        } else {
          fetchPortfolio();
        }
        setWalletAction(null);
        setWalletAmount("");
        setUtrNumber("");
        setProofUrl("");
      } else {
        alert(data.error || "Action failed");
      }
    } catch { alert("Connection error"); }
    finally { setWalletProcessing(false); }
  };

  const handleInvestIntent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !tokensToBuy) return;
    const cost = parseInt(tokensToBuy) * selectedInvoice.tokenPrice;
    setSettlementIntent({ cost, tokens: parseInt(tokensToBuy) });
  };

  const processSettlement = async (method: 'WALLET' | 'RAZORPAY' | 'ESCROW') => {
    if (!settlementIntent || !selectedInvoice) return;
    const { cost, tokens } = settlementIntent;

    if (method === 'ESCROW') {
      alert("Massive institutional transaction limits triggered. Redirecting you to the Escrow Deposit terminal to perform an offline NEFT/RTGS wire.");
      setSettlementIntent(null);
      setSelectedInvoice(null);
      setWalletAction('deposit');
      return;
    }

    if (method === 'RAZORPAY') {
       setInvesting(true);
       const res = await loadRazorpay();
       if (!res) { alert("Gateway failed to load"); setInvesting(false); return; }

       try {
         const token = localStorage.getItem("flowcapital_token");
         const orderRes = await fetch('/api/payment/create-razorpay-order', {
           method: 'POST',
           headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
           body: JSON.stringify({ amount: cost })
         });
         const order = await orderRes.json();

         const options = {
           key: "rzp_test_SdwRb176sqLQ69",
           amount: order.amount,
           currency: order.currency,
           name: "FlowCapital Settlement",
           description: `Token Purchase in ${selectedInvoice.buyer}`,
           order_id: order.id,
           handler: function () {
             executeInvest(true, tokens); // Process the successful investment, fund wallet quietly
           },
           theme: { color: "#3399cc" }
         };

         const rzp = new (window as any).Razorpay(options);
         rzp.on('payment.failed', () => alert("Payment failed"));
         rzp.open();
       } catch (err) {
         console.error(err);
       } finally {
         setInvesting(false);
         setSettlementIntent(null);
       }
       return;
    }

    if (method === 'WALLET') {
      executeInvest(false, tokens);
      setSettlementIntent(null);
    }
  };

  const executeInvest = async (mockDirectFunded = false, specificTokens: number) => {
    setInvesting(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      
      if (mockDirectFunded) {
        const cost = specificTokens * selectedInvoice.tokenPrice;
        await fetch(`/api/payment/deposit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: cost, method: 'RAZORPAY_DIRECT' })
        });
      }

      const res = await fetch("/api/payment/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invoiceId: selectedInvoice.id, tokensToBuy: specificTokens })
      });
      if (res.ok) {
        const data = await res.json();
        // Update marketplace locally with returned invoice data
        if (data.updatedInvoice) {
          setMarketplace(prev => prev.map(inv =>
            inv.id === selectedInvoice.id ? { ...inv, ...data.updatedInvoice } : inv
          ));
        }
        setSuccess(true);
        fetchPortfolio();
        setTimeout(() => {
          setSuccess(false);
          setSelectedInvoice(null);
          setTokensToBuy("");
        }, 3000);
      } else {
        const error = await res.json();
        alert(error.error || "Investment failed");
      }
    } catch { alert("Connection error"); }
    finally { setInvesting(false); }
  };

  const handleDownloadReport = async () => {
    const captureBlock = document.getElementById("portfolio-capture-area");
    if (!captureBlock) return;
    
    // UI feedback (could add state if we wanted to show a loader on the button)
    const btn = document.getElementById("export-btn");
    if (btn) btn.innerText = "Exporting...";

    try {
      // Use html-to-image to bypass html2canvas computed style crashes with OKLCH / LAB colors in Tailwind v4
      const htmlToImage = await import("html-to-image");
      const jsPdfModule = await import("jspdf");
      let JsPdfClass = jsPdfModule.default || jsPdfModule.jsPDF;

      // Extract image via SVG ForeignObject (avoids okLCH parse crashes)
      const imgData = await htmlToImage.toPng(captureBlock, { 
        pixelRatio: 1.5, 
        backgroundColor: "#020817" 
      });
      
      const pdf = new (JsPdfClass as any)("p", "mm", "a4");
      
      // Calculate visual dimensions preserving aspect ratio
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("FlowCapital_Portfolio_Snapshot.pdf");
    } catch (err: any) {
      console.error("PDF generation failed", err);
      alert("Failed to export as PDF: " + (err.message || err.toString()));
    } finally {
      if (btn) btn.innerText = "Export Portfolio";
    }
  };

  const totalInvested = myInvestments.reduce((acc, inv) => acc + inv.amount, 0);
  const totalYield = myInvestments.reduce((acc, inv) => {
    const roi = inv.invoice?.riskScore?.category === 'A' ? 0.085 : inv.invoice?.riskScore?.category === 'B' ? 0.12 : 0.155;
    return acc + (inv.amount * roi * 0.1);
  }, 0);

  const filteredMarketplace = marketplace.filter(inv =>
    !searchQuery || inv.buyer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="portfolio-capture-area" className="space-y-8 max-w-6xl mx-auto relative p-4 rounded-xl bg-background border border-transparent">
      
      {/* Alerts */}
      <AnimatePresence>
        {newInvoiceAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -40, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-xl text-sm font-semibold shadow-2xl bg-blue-500/20 border border-blue-500/30 text-blue-300 backdrop-blur-xl flex items-center gap-2"
          >
            {newInvoiceAlert}
          </motion.div>
        )}
        {purchaseFlash && !newInvoiceAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -40, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] px-5 py-2.5 rounded-xl text-xs font-semibold shadow-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 backdrop-blur-xl"
          >
            {purchaseFlash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">Track investments and discover new yield opportunities.</p>
            <div className={`flex items-center gap-1 text-xs font-medium ${connected ? "text-emerald-400" : "text-red-400"}`}>
              <Wifi className="w-3 h-3" />
              {connected ? "Live" : "Reconnecting..."}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button id="export-btn" variant="outline" onClick={handleDownloadReport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Portfolio
          </Button>
        </div>
      </div>

      {transactions.filter(t => t.status === 'PENDING_PROOF_UPLOAD').map(tx => {
        const expiresAt = new Date(new Date(tx.createdAt).getTime() + 24 * 60 * 60 * 1000);
        const hoursLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));
        return (
          <div key={tx.id} className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="text-rose-500 font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> 
                Action Required: Offline Pledge Fulfillment
              </h3>
              <p className="text-sm text-rose-400 mt-1">
                You committed to a ₹{tx.amount.toLocaleString()} NEFT/RTGS wire. Please upload your bank receipt within {hoursLeft} hours to avoid a 24-hour liquidity routing suspension.
              </p>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
               <Input type="text" placeholder="UTR Number" id={`utr_${tx.id}`} className="bg-background/50 h-9 shrink-0 md:w-32 uppercase text-xs" />
               <Input type="file" id={`proof_${tx.id}`} accept="image/*,.pdf" className="bg-background/50 h-9 w-32 shrink-0 file:text-rose-500 text-xs" />
               <Button size="sm" variant="destructive" className="shrink-0" onClick={async () => {
                 const utrObj = document.getElementById(`utr_${tx.id}`) as HTMLInputElement;
                 const proofObj = document.getElementById(`proof_${tx.id}`) as HTMLInputElement;
                 if (!utrObj.value) return alert('Enter UTR Number');
                 if (!proofObj.files?.length) return alert('Attach Proof Screenshot');
                 
                 const file = proofObj.files[0];
                 const reader = new FileReader();
                 reader.onload = async (event) => {
                   const base64Image = event.target?.result as string;
                   try {
                     const token = localStorage.getItem("flowcapital_token");
                     const res = await fetch("/api/payment/upload-proof", {
                       method: "POST",
                       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                       body: JSON.stringify({ transactionId: tx.id, utrNumber: utrObj.value, proofUrl: base64Image })
                     });
                     const data = await res.json();
                     if (!res.ok) throw new Error(data.error);
                     alert(data.message);
                     fetchPortfolio();
                   } catch (err: any) { alert(err.message); }
                 };
                 reader.readAsDataURL(file);
               }}>
                 Verify
               </Button>
            </div>
          </div>
        );
      })}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Invested", value: `₹${totalInvested.toLocaleString()}`, sub: `₹${totalInvested > 0 ? (totalInvested * 0.05).toFixed(0) : 0} this month`, icon: Briefcase, color: "text-purple-500" },
          { title: "Available Balance", value: `₹${wallet?.balance?.toLocaleString() ?? "0.00"}`, sub: null, icon: Wallet, color: "text-blue-500", actions: true },
          { title: "Net Yield Earned", value: `₹${totalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Lifetime earnings", icon: DollarSign, color: "text-emerald-500" },
          { title: "Active Positions", value: myInvestments.length.toString(), sub: "Invoice pools", icon: BarChart3, color: "text-teal-500" }
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Card className="glass-card h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{stat.value}</div>
                {stat.sub && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />{stat.sub}</p>}
                {(stat as any).actions && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="secondary" className="h-6 text-xs px-2" onClick={() => setWalletAction('deposit')}>Deposit</Button>
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setWalletAction('withdraw')}>Withdraw</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Marketplace Removed from Portfolio Render Route */}

      {/* My Portfolio */}
      {myInvestments.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              My Portfolio
            </CardTitle>
            <CardDescription>Invoice-wise breakdown of your holdings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead>Buyer</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Invested</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myInvestments.map(inv => (
                  <TableRow key={inv.id} className="border-border/40">
                    <TableCell className="font-medium">{inv.invoice?.buyer}</TableCell>
                    <TableCell className="font-mono">{Math.round(inv.share / 100 * (inv.invoice?.totalTokens ?? 0))}</TableCell>
                    <TableCell className="font-mono text-blue-400">₹{inv.amount.toLocaleString()}</TableCell>
                    <TableCell>{inv.share.toFixed(2)}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 text-[10px]">
                        {inv.invoice?.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>A complete log of your wallet and protocol activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/40">
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No transactions recorded yet.</TableCell></TableRow>
              ) : transactions.map((tx) => (
                <TableRow key={tx.id} className="border-border/40">
                  <TableCell className="font-medium capitalize">{tx.type.toLowerCase()}</TableCell>
                  <TableCell className={tx.type === 'WITHDRAWAL' || tx.type === 'INVESTMENT' ? 'text-red-400' : 'text-emerald-400'}>
                    {tx.type === 'WITHDRAWAL' || tx.type === 'INVESTMENT' ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString()}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-transparent text-[10px] uppercase">{tx.status}</Badge></TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs font-mono">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <AnimatePresence>

        {walletAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-md">
              <Card className="glass shadow-2xl border-border">
                <CardHeader>
                  <CardTitle className="capitalize">{walletAction} Funds</CardTitle>
                  <CardDescription>
                    {walletAction === 'deposit' ? 'Add liquidity to your protocol wallet.' : 'Withdraw available funds.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWalletAction} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (INR)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="0.00" required className="pl-9 font-mono bg-background/50" value={walletAmount} onChange={e => setWalletAmount(e.target.value)} />
                      </div>
                    </div>

                    {walletAction === 'deposit' && parseFloat(walletAmount || '0') > 100000 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-border/50">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg space-y-2">
                          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2">Virtual Escrow Account Setup 🔒</p>
                          <p className="text-sm text-foreground/80">Amounts over ₹1,00,000 must be wired via NEFT/RTGS to your dedicated Escrow Vault.</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs bg-black/20 p-2 rounded">
                            <span className="text-muted-foreground">Benificiary:</span><span className="font-bold">FlowCapital Escrow</span>
                            <span className="text-muted-foreground">Account No:</span><span className="font-bold">FLOW{String(userIdRef.current).substring(0, 8).toUpperCase()}</span>
                            <span className="text-muted-foreground">IFSC:</span><span className="font-bold">RATN0VAAPIS</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Bank UTR Transaction Number</label>
                          <Input required placeholder="Ex: AXIR23091..." className="font-mono bg-background/50 uppercase" value={utrNumber} onChange={e => setUtrNumber(e.target.value.toUpperCase())} />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Upload Payment Proof</label>
                          <Input required type="file" accept="image/*,.pdf" className="bg-background/50 file:text-blue-500" onChange={(e) => {
                            if (e.target.files?.length) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => setProofUrl(event.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} />
                          <p className="text-[10px] text-muted-foreground">Attach a screenshot of the successful NEFT/RTGS wire transfer.</p>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => { setWalletAction(null); setWalletAmount(""); setUtrNumber(""); setProofUrl(""); }}>Cancel</Button>
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={walletProcessing}>
                        {walletProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                          (walletAction === 'deposit' && parseFloat(walletAmount || '0') > 100000) ? 'Submit Verification' : 'Confirm via Razorpay'
                        }
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
