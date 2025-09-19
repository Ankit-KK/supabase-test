
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
            <img 
              src="/lovable-uploads/6baaf08e-b2c6-40bd-86d9-0329286b56dc.png" 
              alt="HyperChat - UPI Payment Platform for Creators" 
              className="h-8"
            />
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-sm hover:text-hyperchat-purple transition-colors">
            UPI Payments
          </a>
          <a href="#services" className="text-sm hover:text-hyperchat-purple transition-colors">
            For Creators
          </a>
          <Link to="/feature-showcase" className="text-sm hover:text-hyperchat-purple transition-colors">
            Features
          </Link>
          <Link to="/contact" className="text-sm hover:text-hyperchat-purple transition-colors">
            Contact
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            size="sm" 
            className="bg-hero-gradient hover:opacity-90 transition-opacity"
            onClick={() => setShowSignupDialog(true)}
          >
            Start Earning
          </Button>
        </div>
      </div>
      
      {/* Render SignupDialog conditionally only when needed */}
      {showSignupDialog && (
        <SignupDialog 
          open={showSignupDialog} 
          onOpenChange={setShowSignupDialog}
        />
      )}
    </nav>
  );
};

export default Navbar;
