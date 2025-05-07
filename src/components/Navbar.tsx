
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navbar: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const { user, adminType } = useAuth();

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
          <Link to="/privacy-policy" className="text-sm hover:text-hyperchat-purple transition-colors">
            Privacy Policy
          </Link>
          {user && adminType && (
            <Link to="/admin/dashboard" className="text-sm hover:text-hyperchat-purple transition-colors">
              Admin Dashboard
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="sm" className="hidden md:flex">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/admin/login">
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  Admin Login
                </Button>
              </Link>
              <Button 
                size="sm" 
                className="bg-hero-gradient hover:opacity-90 transition-opacity"
                onClick={() => setShowSignupDialog(true)}
              >
                Get Started
              </Button>
            </>
          )}
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
