
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-hero-gradient">
              🎉 HyperChat
            </span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/contact" className="text-sm hover:text-hyperchat-purple transition-colors">
            Contact Us
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            Log In
          </Button>
          <Button 
            size="sm" 
            className="bg-hero-gradient hover:opacity-90 transition-opacity"
            onClick={() => setShowSignupDialog(true)}
          >
            Get Started
          </Button>
        </div>
      </div>
      
      <SignupDialog 
        open={showSignupDialog} 
        onOpenChange={setShowSignupDialog}
      />
    </nav>
  );
};

export default Navbar;
