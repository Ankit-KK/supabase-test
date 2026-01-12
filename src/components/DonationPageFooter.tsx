import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";

interface DonationPageFooterProps {
  brandColor?: string;
}

const DonationPageFooter: React.FC<DonationPageFooterProps> = ({ brandColor = "#8b5cf6" }) => {
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <>
      <div className="mt-4 space-y-3 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">Want your own donation page?</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSignupOpen(true)}
            className="border-current hover:bg-current/10"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            Sign Up as a Creator
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          This platform is compliant with RBI guidelines for digital payments. 
          All transactions are processed through authorized payment gateways.
        </p>
      </div>
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
    </>
  );
};

export default DonationPageFooter;
