
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import ContractDialog from "@/components/ContractDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
      try {
        const { data, error } = await supabase
          .from("streamer_contracts")
          .select("*")
          .eq("streamer_type", streamerType)
          .single();
        
        if (data) {
          setIsSigned(true);
        } else if (error && error.code !== 'PGRST116') {
          // PGRST116 is the "not found" error, which is expected if not signed
          console.error("Error checking contract status:", error);
          toast({
            title: "Error checking contract status",
            description: "Please try again later",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking contract:", error);
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
        onContractSigned={() => setIsSigned(true)}
      />
    </>
  );
};

export default ContractSigningButton;
