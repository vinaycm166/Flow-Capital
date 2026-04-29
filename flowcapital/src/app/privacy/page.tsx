import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">Privacy Policy</h1>
        <div className="space-y-6 text-muted-foreground text-sm leading-relaxed shadow-sm p-8 rounded-3xl glass-card">
          <p className="font-bold text-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">1. Data We Collect</h2>
          <p>
            To facilitate the FlowCapital platform, we collect business incorporation details, financial read-only data, uploaded invoices, and user identity verification data (KYC/KYB) from you directly and through secure third-party integrations.
          </p>

          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">2. How We Use Your Data</h2>
          <p>
            Your confidential data is utilized strictly to run our machine-learning credit risk underwriting models, verify the legitimacy of invoices, and facilitate regulatory compliance.
          </p>
          <ul className="list-inside list-disc space-y-2 mt-2">
            <li>We do not sell your personal or corporate data to third parties.</li>
            <li>Invoices are securely parsed using our OCR technology entirely internally.</li>
            <li>Marketplace visibility is limited; only necessary financial indicators are shown to pool investors (e.g., Risk Category, Total Asset Value, Days to Maturity) without exposing sensitive line-item data.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">3. Blockchain Privacy</h2>
          <p>
            Blockchain records are inherently public. However, we utilize zero-knowledge proofs and tokenized abstractions to ensure that public ledger entries only contain anonymized hashes and programmatic states, completely protecting your exact business identity and sensitive invoice details from the public chain.
          </p>

          <h2 className="text-xl font-bold text-foreground mt-6 mb-2">4. Data Security</h2>
          <p>
            We implement enterprise-grade encryption (AES-256 for data at rest and TLS 1.3 for data in transit). Access to our core databases is strictly audited, controlled, and monitored 24/7.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
