import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
const Footer: React.FC = () => {
  return <footer className="border-t border-white/10 bg-background">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="col-span-1">
            <div className="text-xl font-bold bg-clip-text text-transparent bg-hero-gradient mb-4">
              🎉 HyperChat
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              A digital engagement platform that enhances presence and communication between creators and their audiences.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>✓ Real-time engagement</p>
              <p>✓ Meaningful connections</p>
              <p>✓ Elevated presence</p>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-4">For Creators</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-hyperchat-purple transition-colors">About HyperChat</a></li>
              <li><a href="#services" className="hover:text-hyperchat-purple transition-colors">Community Building</a></li>
              <li><Link to="/contact" className="hover:text-hyperchat-purple transition-colors">Creator Resources</Link></li>
              <li><a href="#how-it-works" className="hover:text-hyperchat-purple transition-colors">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-hyperchat-purple transition-colors">Audience Expression</a></li>
              <li><a href="#features" className="hover:text-hyperchat-purple transition-colors">Shared Experiences</a></li>
              <li><a href="#features" className="hover:text-hyperchat-purple transition-colors">Community Atmosphere</a></li>
              <li><a href="#features" className="hover:text-hyperchat-purple transition-colors">Creator Connection</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4">Our Websites</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://hyperchat.space" target="_blank" rel="noopener noreferrer" className="hover:text-hyperchat-purple transition-colors inline-flex items-center gap-1">
                  hyperchat.space <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a href="https://hyperchat.site" target="_blank" rel="noopener noreferrer" className="hover:text-hyperchat-purple transition-colors inline-flex items-center gap-1">
                  hyperchat.site <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-hyperchat-purple transition-colors">About HyperChat</Link></li>
              <li><Link to="/contact" className="hover:text-hyperchat-purple transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-hyperchat-purple transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-hyperchat-purple transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/cancellation-refunds" className="hover:text-hyperchat-purple transition-colors">Cancellation & Refunds</Link></li>
              <li><Link to="/shipping" className="hover:text-hyperchat-purple transition-colors">Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} HyperChat - Digital Engagement Platform. All rights reserved.</p>
                <p className="mt-1">A product of <span className="font-medium text-foreground">STREAMHEART PRIVATE LIMITED</span></p>
                <p className="mt-2 text-xs text-left">HyperChat is a digital engagement platform that enhances presence and communication between creators and their audiences.</p>
              </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-hyperchat-purple transition-colors">
              <span className="sr-only">Twitter</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-1-4.8 4-8 8-6 1.6.8 2.7 2.4 3 4z"></path>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-hyperchat-purple transition-colors">
              <span className="sr-only">Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-hyperchat-purple transition-colors">
              <span className="sr-only">Discord</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="9" cy="12" r="1"></circle>
                <circle cx="15" cy="12" r="1"></circle>
                <path d="M7.5 7.2C5.4 8.3 4 10 4 12c0 2 1.4 3.7 3.5 4.8"></path>
                <path d="M16.5 7.2C18.6 8.3 20 10 20 12c0 2-1.4 3.7-3.5 4.8"></path>
                <path d="M8 17h8a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4h-2L12.5 3.5a.8.8 0 0 0-1 0L10 7H8a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4Z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;