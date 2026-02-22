import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
const Navbar: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex flex-col">
          <Link to="/" className="flex flex-col">
            <span className="hidden md:block text-xs font-semibold text-muted-foreground">STREAMHEART PRIVATE LIMITED</span>
            <span className="text-sm font-bold bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink bg-clip-text text-transparent">
              <span className="md:hidden">HyperChat</span>
              <span className="hidden md:inline">HyperChat – Digital Audience Interaction Experience</span>
            </span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <a href="#services" className="text-sm hover:text-hyperchat-purple transition-colors">
            For Creators
          </a>
          <Link to="/feature-showcase" className="text-sm hover:text-hyperchat-purple transition-colors">
            Features
          </Link>
          <Link to="/contact" className="text-sm hover:text-hyperchat-purple transition-colors">
            Contact
          </Link>
          <a href="https://hyperchat.space" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-hyperchat-purple transition-colors inline-flex items-center gap-1">
            hyperchat.space <ExternalLink size={12} />
          </a>
          <a href="https://hyperchat.site" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-hyperchat-purple transition-colors inline-flex items-center gap-1">
            hyperchat.site <ExternalLink size={12} />
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <Button size="sm" className="bg-hero-gradient hover:opacity-90 transition-opacity text-xs sm:text-sm px-3 sm:px-4" onClick={() => setShowSignupDialog(true)}>
            <span className="hidden sm:inline">Get Connected</span>
            <span className="sm:hidden">Join</span>
          </Button>
        </div>
      </div>
      
      {/* Render SignupDialog conditionally only when needed */}
      {showSignupDialog && <SignupDialog open={showSignupDialog} onOpenChange={setShowSignupDialog} />}
    </nav>;
};
export default Navbar;