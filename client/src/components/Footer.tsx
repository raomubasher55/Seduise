import { Link } from "wouter";
import { Twitter, Instagram, MessageCircle, Star } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1E1E1E] border-t border-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between mb-8">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-['Playfair_Display'] text-[#D9B08C] font-bold mb-4">Séduise</h2>
            <p className="text-gray-400 max-w-xs">
              An immersive platform for personalized erotic storytelling, bringing your fantasies to life.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2">
                <li><FooterLink href="/" label="Home" /></li>
                <li><FooterLink href="/discover" label="Discover" /></li>
                <li><FooterLink href="/create" label="Create" /></li>
                <li><FooterLink href="/community" label="Community" /></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><FooterLink href="/terms" label="Terms of Service" /></li>
                <li><FooterLink href="/privacy" label="Privacy Policy" /></li>
                <li><FooterLink href="/guidelines" label="Content Guidelines" /></li>
                <li><FooterLink href="/cookies" label="Cookie Policy" /></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><FooterLink href="/contact" label="Contact Us" /></li>
                <li><FooterLink href="/faq" label="FAQ" /></li>
                <li><FooterLink href="/help" label="Help Center" /></li>
                <li><FooterLink href="/report" label="Report Issues" /></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} Séduise. All rights reserved. 18+ only.</p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-[#D9B08C] transition-colors">
              <Twitter size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-[#D9B08C] transition-colors">
              <Instagram size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-[#D9B08C] transition-colors">
              <MessageCircle size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-[#D9B08C] transition-colors">
              <Star size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

interface FooterLinkProps {
  href: string;
  label: string;
}

const FooterLink = ({ href, label }: FooterLinkProps) => {
  return (
    <Link 
      href={href} 
      className="text-gray-400 hover:text-[#D9B08C] transition-colors"
    >
      {label}
    </Link>
  );
};

export default Footer;
