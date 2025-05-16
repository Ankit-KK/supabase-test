
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navbar: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/">
            <img 
              src="/lovable-uploads/6baaf08e-b2c6-40bd-86d9-0329286b56dc.png" 
              alt="HyperChat" 
              className="h-6 md:h-8"
            />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/contact" className="text-sm hover:text-hyperchat-purple transition-colors">
            Contact Us
          </Link>
          <Link to="/privacy-policy" className="text-sm hover:text-hyperchat-purple transition-colors">
            Privacy Policy
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            size="sm" 
            className="bg-hero-gradient hover:opacity-90 transition-opacity"
            onClick={() => setShowSignupDialog(true)}
          >
            Get Started
          </Button>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="p-1">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] bg-background/90 backdrop-blur-lg">
              <div className="flex flex-col space-y-4 mt-8">
                <Link to="/contact" className="text-sm hover:text-hyperchat-purple transition-colors py-2">
                  Contact Us
                </Link>
                <Link to="/privacy-policy" className="text-sm hover:text-hyperchat-purple transition-colors py-2">
                  Privacy Policy
                </Link>
                <Button 
                  className="bg-hero-gradient hover:opacity-90 transition-opacity w-full mt-2"
                  onClick={() => setShowSignupDialog(true)}
                >
                  Get Started
                </Button>
              </div>
            </SheetContent>
          </Sheet>
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
