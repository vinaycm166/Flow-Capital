"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText,
  RefreshCw,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Activity,
  TrendingUp,
  Filter,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

const TYPE_STYLES: Record<string, { badge: string; icon: string; prefix: string }> = {
  DEPOSIT: {
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: "text-emerald-500",
    prefix: "+",
  },
  WITHDRAWAL: {
    badge: "bg-red-500/10 text-red-400 border-red-400/20",
    icon: "text-red-400",
    prefix: "-",
  },
  INVESTMENT: {
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: "text-blue-500",
    prefix: "-",
  },
  SETTLEMENT: {
    badge: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    icon: "text-violet-500",
    prefix: "+",
  },
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-400/20",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className ?? ""}`} />;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut" },
  }),
};

type SortKey = "createdAt" | "amount" | "type";
type SortDir = "asc" | "desc";

export default function SMETransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchTransactions = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/payment/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTransactions(await res.json());
    } catch (err) {
      console.error("Transactions fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  /* -------- derived data -------- */
  const typeList = useMemo(() => {
    const set = new Set(transactions.map((t) => t.type));
    return Array.from(set);
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterType !== "ALL") list = list.filter((t) => t.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.type.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q) ||
          t.amount.toString().includes(q) ||
          new Date(t.createdAt).toLocaleString().toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === "amount") {
        cmp = a.amount - b.amount;
      } else {
        cmp = a.type.localeCompare(b.type);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [transactions, filterType, search, sortKey, sortDir]);

  const kpis = useMemo(() => {
    const totalVolume = transactions.reduce((a, t) => a + t.amount, 0);
    const deposits = transactions.filter((t) => t.type === "DEPOSIT").reduce((a, t) => a + t.amount, 0);
    const withdrawals = transactions.filter((t) => t.type === "WITHDRAWAL").reduce((a, t) => a + t.amount, 0);
    const investments = transactions.filter((t) => t.type === "INVESTMENT").reduce((a, t) => a + t.amount, 0);
    const settlements = transactions.filter((t) => t.type === "SETTLEMENT").reduce((a, t) => a + t.amount, 0);
    return { totalVolume, deposits, withdrawals, investments, settlements, count: transactions.length };
  }, [transactions]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  /* -------- loading skeleton -------- */
  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto w-full">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-500" />
            Transaction History
          </h1>
          <p className="text-muted-foreground mt-1">Complete ledger of all protocol financial interactions.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchTransactions(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* -------- KPI Cards -------- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Transactions",
            value: kpis.count,
            sub: `₹${kpis.totalVolume.toLocaleString()} total volume`,
            icon: Activity,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            title: "Deposits",
            value: `+₹${kpis.deposits.toLocaleString()}`,
            sub: `${transactions.filter((t) => t.type === "DEPOSIT").length} transactions`,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            title: "Investments",
            value: `₹${kpis.investments.toLocaleString()}`,
            sub: `${transactions.filter((t) => t.type === "INVESTMENT").length} transactions`,
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            title: "Settlements",
            value: `+₹${kpis.settlements.toLocaleString()}`,
            sub: `${transactions.filter((t) => t.type === "SETTLEMENT").length} returns`,
            icon: Activity,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
          },
        ].map((kpi, i) => (
          <motion.div key={kpi.title} custom={i} variants={fadeUp} initial="hidden" animate="show">
            <Card className="glass-card hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* -------- Filters & Search -------- */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Ledger</CardTitle>
                <CardDescription>
                  Showing {filtered.length} of {transactions.length} transactions
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-secondary/50 border border-border/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-44 transition-all"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-xs bg-secondary/50 border border-border/40 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    <option value="ALL">All Types</option>
                    {typeList.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <FileText className="h-10 w-10 opacity-30" />
                <p className="text-sm">
                  {transactions.length === 0
                    ? "No transactions recorded yet."
                    : "No transactions match your filters."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("type")}>
                      <span className="flex items-center">
                        Event <SortIcon col="type" />
                      </span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                      <span className="flex items-center">
                        Amount <SortIcon col="amount" />
                      </span>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                      <span className="flex items-center justify-end">
                        Time <SortIcon col="createdAt" />
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((tx, idx) => {
                      const style = TYPE_STYLES[tx.type] ?? {
                        badge: "bg-secondary text-foreground",
                        icon: "text-foreground",
                        prefix: "",
                      };
                      const statusStyle = STATUS_STYLES[tx.status] ?? "bg-secondary text-foreground";
                      return (
                        <motion.tr
                          key={tx.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, delay: idx * 0.02 }}
                          className="border-b border-border/20 hover:bg-secondary/20 transition-colors"
                        >
                          <TableCell>
                            <Badge variant="outline" className={`${style.badge} text-xs gap-1 capitalize`}>
                              {tx.type.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-mono font-semibold ${style.icon}`}>
                            {style.prefix}₹{tx.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${statusStyle} text-[10px]`}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs">
                            <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                            <div className="text-[10px] opacity-70">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
