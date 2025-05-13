
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import ContractDialog from "@/components/ContractDialog";
import { supabase } from "@/integrations/supabase/client";

interface ContractSigningButtonProps {
  streamerName: string;
  streamerType: string; // 'ankit', 'harish', or 'mackle'
}

const ContractSigningButton: React.FC<ContractSigningButtonProps> = ({ 
  streamerName,
  streamerType
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  
  // Check if contract has been signed
  useEffect(() => {
    const checkContractStatus = async () => {
      const { data, error } = await supabase
        .from("streamer_contracts")
        .select("*")
        .eq("streamer_type", streamerType)
        .single();
      
      if (data) {
        setIsSigned(true);
      }
    };
    
    checkContractStatus();
  }, [streamerType]);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setDialogOpen(true)}
      >
        <FileText className="mr-2 h-4 w-4" />
        {isSigned ? "View Contract" : "Sign Contract"}
      </Button>
      
      <ContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        streamerName={streamerName}
        streamerType={streamerType}
      />
    </>
  );
};

export default ContractSigningButton;
