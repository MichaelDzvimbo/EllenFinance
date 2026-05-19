import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";

const WHATSAPP_NUMBER = "263783286316";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Ellen%20Finance%2C%20I%20have%20an%20enquiry.`;

export function Layout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Ellen Finance" className="h-16 w-auto" />
            <span className="hidden sm:block font-serif text-xs text-muted-foreground italic leading-tight max-w-[140px]">
              Transforming lives through financial aid
            </span>
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
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="p-4 text-lg font-medium text-[#25D366] flex items-center gap-2"
            >
              <MessageCircle size={20} /> Chat on WhatsApp
            </a>
          </nav>
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-primary text-primary-foreground py-12 border-t border-primary/20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <img src="/logo.png" alt="Ellen Finance" className="h-14 w-auto brightness-0 invert" />
            <p className="font-serif text-[#c9972c] italic text-lg">Transforming lives through financial aid</p>
            <p className="text-primary-foreground/70 max-w-sm text-sm leading-relaxed">
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
            <div className="text-primary-foreground/80 space-y-2 text-sm">
              <p>6th Avenue, Harare, Zimbabwe</p>
              <p>Phone: +263 78 328 6316</p>
              <p>Email: support@ellenfinance.co.zw</p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <MessageCircle size={16} /> WhatsApp Us
            </a>
            <div className="flex items-center gap-4 mt-2 bg-primary-foreground/10 p-3 rounded-lg w-fit">
              <img src="/ecocash.png" alt="EcoCash" className="h-6 object-contain" />
              <img src="/innbucks.png" alt="InnBucks" className="h-6 object-contain" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/10 text-center text-primary-foreground/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Ellen Finance. All rights reserved. &mdash; Harare, Zimbabwe</p>
        </div>
      </footer>

      {/* WhatsApp Floating Bubble */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        {/* Tooltip */}
        <span className="absolute right-16 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Chat on WhatsApp
        </span>
      </a>
    </div>
  );
}
