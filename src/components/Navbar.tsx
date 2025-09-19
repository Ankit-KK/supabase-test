
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut } from "lucide-react";

const Navbar: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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
          {user && (
            <Link to="/dashboard" className="text-sm hover:text-hyperchat-purple transition-colors font-medium">
              Dashboard
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/auth">
                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Button 
                size="sm" 
                className="bg-hero-gradient hover:opacity-90 transition-opacity"
                onClick={() => setShowSignupDialog(true)}
              >
                Start Earning
              </Button>
            </div>
          )}
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
