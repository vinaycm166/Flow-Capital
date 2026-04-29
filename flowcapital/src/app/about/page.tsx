import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">About FlowCapital</h1>
        <div className="space-y-6 text-muted-foreground text-lg leading-relaxed shadow-sm p-8 rounded-3xl glass-card">
          <p>
            FlowCapital is building the autonomous liquidity layer for global trade. We believe that access to working capital should be instant, transparent, and seamless for businesses of all sizes, everywhere.
          </p>
          <p>
            By combining advanced AI risk underwriting with the speed and programmability of blockchain-based settlement protocols, we transform illiquid receivables into highly liquid, yield-bearing assets.
          </p>
          
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Our Mission</h2>
          <p>
            To democratize access to corporate financing by breaking down the walls of traditional supply chain finance. We connect SMEs seeking predictable cash flow directly with investors seeking uncorrelated, high-quality, short-term debt yield.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Our Core Values</h2>
          <ul className="list-inside list-disc space-y-2">
            <li><strong className="text-foreground">Transparency:</strong> Immutable ledgers guarantee truth.</li>
            <li><strong className="text-foreground">Speed:</strong> Capital should move at the speed of information.</li>
            <li><strong className="text-foreground">Inclusivity:</strong> Access to capital shouldn't depend on who you know.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
