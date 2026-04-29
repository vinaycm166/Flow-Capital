import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, ExternalLink, Activity, Network, ShieldCheck, Database } from "lucide-react";

export default function TransparencyPage() {
  const contractStatus = [
    { name: "Core Protocol", address: "0x8faB...291C", status: "Active", network: "Ethereum", audited: true },
    { name: "Liquidity Pool v2", address: "0x3e1F...9A42", status: "Active", network: "Base", audited: true },
    { name: "Tokenization Engine", address: "0x78Cd...10cF", status: "Active", network: "Polygon", audited: true },
    { name: "AI Oracle Feeds", address: "0x0B2A...E47D", status: "Active", network: "Chainlink", audited: true },
  ];

  const transactions: any[] = [];
  const timelineEvents: any[] = [];

  return (
    <div className="min-h-screen bg-background relative selection:bg-blue-500/30">
      <Navbar />
      
      {/* Background elements */}
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-background pointer-events-none" />
      <div className="absolute top-40 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-60 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="pt-32 pb-24 container mx-auto px-4 relative z-10 max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="px-3 py-1 bg-background/50 backdrop-blur border-blue-500/30 text-blue-500">Public Explorer</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">On-Chain <span className="text-gradient">Transparency</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Verify every transaction, smart contract state, and settlement event in real-time. FlowCapital is built on trustless infrastructure.
          </p>
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          {/* Timeline */}
          <Card className="lg:col-span-1 glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Network Activity</CardTitle>
              <CardDescription>Live feed of protocol events.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-border/60 ml-4 mt-2 space-y-8 pb-4">
                {timelineEvents.map((event, i) => (
                  <div key={i} className="relative pl-8">
                    <div className={`absolute -left-4 w-8 h-8 rounded-full ${event.bg} ${event.color} flex items-center justify-center border-4 border-background`}>
                      <event.icon className="w-3 h-3" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                      <h4 className="text-sm font-semibold">{event.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-8">
            {/* Contracts */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Smart Contracts</CardTitle>
                <CardDescription>Verified infrastructure powering the protocol.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead>Contract</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractStatus.map((c, i) => (
                        <TableRow key={i} className="border-border/20">
                          <TableCell className="font-medium flex items-center gap-2">
                            {c.name} {c.audited && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                              {c.address} <Copy className="w-3 h-3" />
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-secondary/50 font-normal">{c.network}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              {c.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Log */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-purple-500" /> Recent Transactions</CardTitle>
                    <CardDescription>Latest on-chain settlements and liquidity events.</CardDescription>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead>Tx Hash</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx, i) => (
                        <TableRow key={i} className="border-border/20">
                          <TableCell>
                            <span className="font-mono text-xs text-blue-500 hover:underline cursor-pointer">{tx.hash}</span>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{tx.type}</TableCell>
                          <TableCell className="font-mono text-sm">{tx.amount}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{tx.time}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                              {tx.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
