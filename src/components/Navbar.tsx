import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";
import { Link } from "react-router-dom";
import hyperchatLogo from "@/assets/hyperchat-logo.png";

const Navbar: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={hyperchatLogo} alt="HyperChat" className="h-8 md:h-10" />
            <div className="flex flex-col">
              <span className="hidden md:block text-xs font-semibold text-muted-foreground">STREAMHEART PRIVATE LIMITED</span>
              <span className="text-sm font-bold">
                <span className="text-hyperchat-blue md:hidden">HyperChat</span>
                <span className="hidden md:inline">
                  <span className="text-hyperchat-blue">Hyper</span>
                  <span className="bg-gradient-to-r from-hyperchat-blue to-hyperchat-purple bg-clip-text text-transparent">Chat</span>
                  <span className="text-foreground"> – Digital Audience Interaction Experience</span>
                </span>
              </span>
            </div>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <a href="#services" className="text-sm text-foreground/80 hover:text-primary transition-colors">
            For Creators
          </a>
          <Link to="/feature-showcase" className="text-sm text-foreground/80 hover:text-primary transition-colors">
            Features
          </Link>
          <Link to="/contact" className="text-sm text-foreground/80 hover:text-primary transition-colors">
            Contact
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button size="sm" className="bg-hero-gradient hover:opacity-90 transition-opacity text-xs sm:text-sm px-3 sm:px-4 text-white" onClick={() => setShowSignupDialog(true)}>
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