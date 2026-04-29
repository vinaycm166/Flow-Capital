"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Network, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SupplyChainDashboard() {
  return (
    <div className="space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Supply Chain Explorer</h1>
          <p className="text-muted-foreground mt-1">Map, evaluate, and fund your entire vendor network.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
           <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input placeholder="Search vendors..." className="pl-8 bg-background/50 h-10" />
          </div>
          <Button variant="outline" className="h-10 px-3"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="glass-card h-[500px] flex flex-col items-center justify-center border-border/50 text-center relative overflow-hidden bg-gradient-to-br from-indigo-900/10 to-background">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full"></div>
          
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-teal-500/20 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-lg mb-6 z-10 relative">
             <Network className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 z-10 relative">Network Graph Active</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6 z-10 relative">
            Connect your ERP modules to automatically map Tier 1, 2, and 3 vendor dependencies and dynamically optimize node-level liquidity.
          </p>
          
          <Button className="z-10 relative bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
            Initialize Module Integration
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
