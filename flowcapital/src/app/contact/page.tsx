import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient text-center">Get in Touch</h1>
        <p className="text-center text-muted-foreground mb-8">
          Have questions about onboarding as an Enterprise, acting as a Liquidity Provider, or obtaining financing? We're here to help.
        </p>

        <form className="space-y-6 shadow-sm p-8 rounded-3xl glass-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input placeholder="John" className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input placeholder="Doe" className="bg-background/50" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Corporate Email</label>
            <Input type="email" placeholder="john@enterprise.com" className="bg-background/50" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Identity</label>
            <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="SME">SME/MSME Seeking Capital</option>
              <option value="ENTERPRISE">Enterprise Verifier</option>
              <option value="INVESTOR">Institutional Investor</option>
              <option value="OTHER">Other Query</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea 
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="How can we assist your business?"
            />
          </div>

          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12">
            Send Message
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-4">
            Alternatively, email us directly at support@flowcapital.finance
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
