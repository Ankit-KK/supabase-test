
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Pencil } from "lucide-react";
import ContractDialog from "@/components/ContractDialog";
import EditableContractDialog from "@/components/EditableContractDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isAdminAuthenticated } from "@/services/streamerAuth";

interface ContractSigningButtonProps {
  streamerName: string;
  streamerType: string; // 'ankit', 'harish', 'mackle', or 'rakazone'
}

const ContractSigningButton: React.FC<ContractSigningButtonProps> = ({ 
  streamerName,
  streamerType
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if contract has been signed and if user is admin
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check admin status
        const adminStatus = isAdminAuthenticated(streamerType);
        setIsAdmin(adminStatus);
        
        // Check contract status
        const { data, error } = await supabase
          .from("streamer_contracts")
          .select("*")
          .eq("streamer_type", streamerType)
          .single();
        
        if (data) {
          setIsSigned(true);
        } else if (error && error.code !== 'PGRST116') {
          // PGRST116 is the "not found" error, which is expected if not signed
          console.warn("Contract status not accessible or not found:", error);
          // Treat as unsigned when we don't have permission to read
          setIsSigned(false);
        }
      } catch (error) {
        console.error("Error checking contract:", error);
      }
    };
    
    checkStatus();
  }, [streamerType]);

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={() => setDialogOpen(true)}
      >
        <FileText className="mr-2 h-4 w-4" />
        {isSigned ? "View Contract" : "Sign Contract"}
      </Button>
      
      {isAdmin && (
        <Button 
          variant="outline" 
          onClick={() => setEditDialogOpen(true)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Template
        </Button>
      )}
      
      <ContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        streamerName={streamerName}
        streamerType={streamerType}
        onContractSigned={() => setIsSigned(true)}
      />
      
      <EditableContractDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        streamerName={streamerName}
        streamerType={streamerType}
        onContractSaved={() => {
          toast({
            title: "Contract template updated",
            description: "The contract template has been saved successfully",
          });
        }}
      />
    </div>
  );
};

export default ContractSigningButton;
