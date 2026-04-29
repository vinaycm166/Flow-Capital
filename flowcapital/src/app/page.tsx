"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BrainCircuit, Blocks, Zap, ShieldCheck, CheckCircle2, TrendingUp } from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/20 blur-[120px] animate-pulse" style={{ animationDelay: "2s" }}></div>
      
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-32 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full glass border border-white/10">
              <span className="text-gradient font-medium">Flow Protocol v2 is live</span>
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              Unlock <span className="text-gradient">Instant Liquidity</span> From Your Invoices
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AI + Blockchain powered financing marketplace. Turn your unpaid invoices into capital instantly, while investors earn stable yields.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Link href="/login?role=SME" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 h-14 text-lg shadow-xl shadow-blue-500/25 flex flex-col items-center py-2 h-auto gap-1">
                  <span className="font-bold">SME/MSME</span>
                  <span className="text-xs opacity-80 font-normal">SME factoring</span>
                </Button>
              </Link>
              <Link href="/login?role=ENTERPRISE" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 h-14 text-lg shadow-xl shadow-indigo-500/25 flex flex-col items-center py-2 h-auto gap-1">
                  <span className="font-bold">CORPORATE</span>
                  <span className="text-xs opacity-80 font-normal">Supply chain finance</span>
                </Button>
              </Link>
              <Link href="/login?role=INVESTOR" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full rounded-2xl px-10 h-14 text-lg glass flex flex-col items-center py-2 h-auto gap-1 border-white/20 hover:bg-white/5">
                  <span className="font-bold">INVESTOR</span>
                  <span className="text-xs opacity-80 font-normal">Earn stable yields</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-12 relative z-10 border-y border-border/40 bg-background/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border/40">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="p-4">
              <h3 className="text-4xl font-bold text-gradient mb-2">₹4,000Cr+</h3>
              <p className="text-muted-foreground font-medium">Total Liquidity Provided</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="p-4">
              <h3 className="text-4xl font-bold text-gradient mb-2">&lt; 3s</h3>
              <p className="text-muted-foreground font-medium">Average Funding Time</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="p-4">
              <h3 className="text-4xl font-bold text-gradient mb-2">90 → 0</h3>
              <p className="text-muted-foreground font-medium">Days to Receive Payment</p>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-32 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">The Future of Factoring</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We combine artificial intelligence for instant risk assessment with blockchain smart contracts for trustless settlement.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants}>
              <Card className="glass-card h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-500">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Risk Scoring</h3>
                  <p className="text-muted-foreground text-sm">Our ML models analyze financials in seconds to assign dynamic risk scores and dynamic pricing.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="glass-card h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4 text-teal-500">
                    <Blocks className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Invoice Tokenization</h3>
                  <p className="text-muted-foreground text-sm">Invoices are converted to composable fractional NFTs or ERC-20s for highly liquid marketplace trading.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="glass-card h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-500">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Instant Funding</h3>
                  <p className="text-muted-foreground text-sm">Once uploaded, approved invoices are funded via automated liquidity pools within seconds.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="glass-card h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Smart Settlement</h3>
                  <p className="text-muted-foreground text-sm">Payments are routed and settled programmatically on-chain with zero counterparty risk.</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-4 py-24 relative z-10">
           <div className="bg-secondary/30 rounded-3xl p-8 md:p-16 border border-border/50">
             <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start text-center relative">
               {/* Connecting line for desktop */}
               <div className="hidden md:block absolute top-[20%] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-blue-500/0 via-teal-500/50 to-blue-500/0 -z-10"></div>
               
               {[
                 { step: "01", title: "Upload Invoice", desc: "SME connects ERP or uploads an invoice." },
                 { step: "02", title: "AI Analysis", desc: "Instant credit scoring & limits." },
                 { step: "03", title: "Tokenization", desc: "Minted on-chain as yield asset." },
                 { step: "04", title: "Funded", desc: "Investors fund the pool instantly." },
                 { step: "05", title: "Settlement", desc: "Auto-repayment on due date." }
               ].map((item, index) => (
                 <motion.div 
                   key={index}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: index * 0.15 }}
                   className="flex flex-col items-center"
                 >
                   <div className="w-16 h-16 rounded-2xl bg-background border border-border glass-card flex items-center justify-center text-xl font-bold text-gradient mb-4">
                     {item.step}
                   </div>
                   <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                   <p className="text-sm text-muted-foreground">{item.desc}</p>
                 </motion.div>
               ))}
             </div>
           </div>
        </section>

        {/* Investor Section */}
        <section id="investors" className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}>
              <Badge className="bg-blue-600/10 text-blue-500 border-blue-600/20 mb-4">For Capital Providers</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Access Institutional Grade <span className="text-gradient">Yield</span></h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join a decentralized marketplace where you can fund individual invoices or join diversified liquidity pools. Earn predictable returns backed by real-world trade receivables.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "8-15% Targeted APY",
                  "Fully collateralized by invoices",
                  "AI-powered real-time risk scoring",
                  "Instant liquidity via secondary markets"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-sm">
                    <CheckCircle2 className="h-5 w-5 text-teal-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=INVESTOR">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-blue-500/20">
                  Start Investing Today
                </Button>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="relative">
               <div className="aspect-square rounded-3xl bg-secondary/30 border border-border/50 p-8 flex items-center justify-center">
                  <div className="w-full h-full relative">
                     <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-blue-600/20 to-transparent rounded-b-2xl"></div>
                     <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-blue-500 opacity-20" />
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-extrabold text-gradient">12.5%</span>
                        <span className="text-sm font-medium text-muted-foreground">Average Investor APY</span>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
