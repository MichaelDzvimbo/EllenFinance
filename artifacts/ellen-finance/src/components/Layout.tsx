import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Ellen Finance" className="h-10 w-auto" />
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
              Home
            </Link>
            <Link href="/apply" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/apply' ? 'text-primary' : 'text-muted-foreground'}`}>
              Apply for Loan
            </Link>
            <Link href="/status" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/status' ? 'text-primary' : 'text-muted-foreground'}`}>
              Track Status
            </Link>
            <Link href="/kyc" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/kyc' ? 'text-primary' : 'text-muted-foreground'}`}>
              Upload Documents
            </Link>
            <Link href="/contact" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/contact' ? 'text-primary' : 'text-muted-foreground'}`}>
              Contact Us
            </Link>
            <Link href="/apply" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 rounded-md font-medium transition-colors flex items-center justify-center">
              Apply Now
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-20 z-40 bg-background border-t">
          <nav className="flex flex-col p-4 gap-4">
            <Link href="/" onClick={closeMenu} className={`p-4 text-lg font-medium border-b ${location === '/' ? 'text-primary' : 'text-foreground'}`}>
              Home
            </Link>
            <Link href="/apply" onClick={closeMenu} className={`p-4 text-lg font-medium border-b ${location === '/apply' ? 'text-primary' : 'text-foreground'}`}>
              Apply for Loan
            </Link>
            <Link href="/status" onClick={closeMenu} className={`p-4 text-lg font-medium border-b ${location === '/status' ? 'text-primary' : 'text-foreground'}`}>
              Track Status
            </Link>
            <Link href="/kyc" onClick={closeMenu} className={`p-4 text-lg font-medium border-b ${location === '/kyc' ? 'text-primary' : 'text-foreground'}`}>
              Upload Documents
            </Link>
            <Link href="/contact" onClick={closeMenu} className={`p-4 text-lg font-medium border-b ${location === '/contact' ? 'text-primary' : 'text-foreground'}`}>
              Contact Us
            </Link>
          </nav>
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-primary text-primary-foreground py-12 border-t border-primary/20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <img src="/logo.png" alt="Ellen Finance" className="h-10 w-auto brightness-0 invert" />
            <p className="text-primary-foreground/80 max-w-sm font-serif text-lg leading-relaxed">
              Empowering Zimbabwean entrepreneurs and families with accessible, dignified financial solutions. Your growth is our business.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-serif text-xl font-bold text-secondary">Quick Links</h4>
            <nav className="flex flex-col gap-2 text-primary-foreground/80">
              <Link href="/apply" className="hover:text-secondary transition-colors">Apply for a Loan</Link>
              <Link href="/status" className="hover:text-secondary transition-colors">Track Application</Link>
              <Link href="/kyc" className="hover:text-secondary transition-colors">Submit Documents</Link>
              <Link href="/contact" className="hover:text-secondary transition-colors">Contact Support</Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="font-serif text-xl font-bold text-secondary">Contact Us</h4>
            <div className="text-primary-foreground/80 space-y-2">
              <p>Harare, Zimbabwe</p>
              <p>Phone: +263 78 328 6316</p>
              <p>Email: support@ellenfinance.co.zw</p>
            </div>
            <div className="flex items-center gap-4 mt-4 bg-primary-foreground/10 p-3 rounded-lg w-fit">
              <img src="/ecocash.png" alt="EcoCash" className="h-6 object-contain" />
              <img src="/innbucks.png" alt="InnBucks" className="h-6 object-contain" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/10 text-center text-primary-foreground/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Ellen Finance. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
