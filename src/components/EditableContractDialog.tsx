import React, { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Save, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface EditableContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamerName: string;
  streamerType: string;
  onContractSaved?: () => void;
  previewMode?: boolean;
}

const EditableContractDialog: React.FC<EditableContractDialogProps> = ({ 
  open, 
  onOpenChange,
  streamerName,
  streamerType,
  onContractSaved,
  previewMode = false
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(streamerName);
  const [streamerCut, setStreamerCut] = useState(80);
  const [hyperChatCut, setHyperChatCut] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  
  // Contract sections
  const [purpose, setPurpose] = useState("HyperChat provides a fan engagement and donation tool designed for live streamers. This Agreement outlines the terms under which the Streamer may access and use the HyperChat platform.");
  const [grantOfAccess, setGrantOfAccess] = useState("HyperChat grants the Streamer a non-exclusive, non-transferable license to use its platform for the purpose of enhancing live streams and enabling fan support through premium messages, real-time reactions, and related features.");
  const [responsibilities, setResponsibilities] = useState("- Integrate HyperChat into their live streaming sessions (e.g., Twitch, YouTube, Kick, etc.).\n- Maintain an active and respectful community environment.\n- Not misuse the platform for offensive, illegal, or prohibited content.");
  const [intellectualProperty, setIntellectualProperty] = useState("- All platform content, branding, and underlying software remain the sole property of HyperChat.\n- The Streamer retains rights to their own content but grants HyperChat permission to feature their stream/channel for promotional use (with prior notice).");
  const [termination, setTermination] = useState("- This Agreement begins on the Effective Date and continues until terminated by either party with **7 days' written notice**.\n- HyperChat reserves the right to suspend or terminate access for violations of terms, abuse of service, or unlawful activity.");
  const [confidentiality, setConfidentiality] = useState("The Streamer agrees not to disclose any non-public information about HyperChat, including platform features under development, financial terms, or internal strategies.");
  const [liability, setLiability] = useState("HyperChat shall not be liable for indirect, incidental, or consequential damages arising from the use of its platform.");
  const [governingLaw, setGoverningLaw] = useState("This Agreement shall be governed by the laws of **India**, and any disputes shall be resolved in the courts of that jurisdiction.");
  const [entireAgreement, setEntireAgreement] = useState("This Agreement constitutes the entire understanding between the parties and supersedes any prior agreements or understandings.");

  // Check if contract exists when dialog opens
  useEffect(() => {
    if (open) {
      fetchContractData();
    }
  }, [open, streamerType]);

  const fetchContractData = async () => {
    try {
      const { data, error } = await supabase
        .from("streamer_contracts")
        .select("*")
        .eq("streamer_type", streamerType)
        .single();
      
      if (data) {
        setStreamerCut(data.streamer_cut || 80);
        setHyperChatCut(data.hyperchat_cut || 20);
        setName(data.streamer_name);
        
        // Load additional contract data if available
        // This is where we would load any custom contract text from database
        // For now, we'll use the defaults
      }
    } catch (error) {
      console.error("Error fetching contract data:", error);
    }
  };

  const handleSaveContract = async () => {
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter the streamer's name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      // First check if a contract record already exists
      const { data: existingContract, error: checkError } = await supabase
        .from("streamer_contracts")
        .select("*")
        .eq("streamer_type", streamerType)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // An error occurred that wasn't just "not found"
        console.error("Error checking existing contract:", checkError);
        throw checkError;
      }

      // Prepare contract data
      const contractData = {
        streamer_type: streamerType,
        streamer_name: name,
        streamer_cut: streamerCut,
        hyperchat_cut: hyperChatCut,
        // For insert, we need a signature value
        signature: existingContract?.signature || "template_only",
        // If it's a template, we set agreed_to_terms to false
        agreed_to_terms: existingContract?.agreed_to_terms || false
      };

      // Use upsert operation with single object
      const { error } = await supabase
        .from("streamer_contracts")
        .upsert(contractData, { onConflict: "streamer_type" });

      if (error) {
        console.error("Error saving contract:", error);
        throw error;
      }

      if (onContractSaved) {
        onContractSaved();
      }
      
      toast({
        title: "Contract template saved successfully",
        description: "The contract template has been updated",
      });
    } catch (error: any) {
      console.error("Error saving contract:", error);
      toast({
        title: "Error saving contract",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadContract = () => {
    // Get current date for the contract
    const currentDate = new Date().toLocaleDateString();
    
    toast({
      title: "Preparing PDF",
      description: "Generating your contract PDF...",
    });

    // Create a temporary container for the contract content
    if (!contractRef.current) return;

    // Use html2canvas with optimized scale settings
    html2canvas(contractRef.current, {
      scale: 2, // Higher scale for better quality
      logging: false,
      backgroundColor: "#ffffff"
    }).then(canvas => {
      // Create PDF with the captured content
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions to fit on PDF
      const imgWidth = 210; // A4 width in mm (portrait)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png');
      
      // Add the contract content as an image
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`HyperChat_${streamerType}_Agreement_Template_${currentDate.replace(/\//g, '-')}.pdf`);
      
      toast({
        title: "Contract downloaded",
        description: "The contract template has been downloaded as a PDF",
      });
    }).catch(error => {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error creating PDF",
        description: "Could not generate the contract PDF",
      });
    });
  };

  // Handle the streamer cut change
  const handleCutChange = (newStreamerCut: number) => {
    setStreamerCut(newStreamerCut);
    setHyperChatCut(100 - newStreamerCut);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {previewMode ? "Contract Template Preview" : "Edit Contract Template"}
          </DialogTitle>
          <DialogDescription>
            {previewMode 
              ? "Preview the contract template before it's sent to streamers" 
              : "Customize the contract template for streamers to sign"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="flex justify-between items-center">
            <div className="w-1/2 space-y-2 pr-2">
              <Label htmlFor="streamer-name">Streamer Name</Label>
              <Input
                id="streamer-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter streamer name"
                disabled={previewMode}
              />
            </div>
            
            <div className="w-1/2 space-y-2 pl-2">
              <Label>Revenue Split</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="streamer-cut" className="text-sm">Streamer: {streamerCut}%</Label>
                  <Input
                    id="streamer-cut"
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={streamerCut}
                    onChange={(e) => handleCutChange(parseInt(e.target.value))}
                    disabled={previewMode}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="hyperchat-cut" className="text-sm">HyperChat: {hyperChatCut}%</Label>
                  <Input
                    id="hyperchat-cut"
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={hyperChatCut}
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div ref={contractRef} className="border rounded-md p-6 space-y-6 bg-white text-black min-h-[500px]">
            <div className="text-center">
              <h1 className="text-2xl font-bold">HyperChat Streamer Agreement</h1>
            </div>
            
            <p><strong>This Agreement</strong> ("Agreement") is entered into by and between:</p>
            
            <p>
              <strong>HyperChat Technologies Pvt. Ltd.</strong>, a registered MSME under Udyam Registration No. <strong>UP29D0047796</strong>, with its principal office at <strong>Ghaziabad</strong>,<br />
              and<br />
              <strong>{name || "[Streamer Name]"}</strong>,<br />
              collectively referred to as the "Parties".
            </p>
            
            <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
            
            {!previewMode ? (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="purpose-section">1. Purpose</Label>
                    <Textarea 
                      id="purpose-section"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="grant-section">2. Grant of Access</Label>
                    <Textarea 
                      id="grant-section"
                      value={grantOfAccess}
                      onChange={(e) => setGrantOfAccess(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="responsibilities-section">3. Streamer Responsibilities</Label>
                    <Textarea 
                      id="responsibilities-section"
                      value={responsibilities}
                      onChange={(e) => setResponsibilities(e.target.value)}
                      className="mt-1 min-h-[150px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="revenue-section">4. Revenue Sharing</Label>
                    <Textarea 
                      id="revenue-section"
                      value={`- **${streamerCut}%** to the Streamer\n- **${hyperChatCut}%** to HyperChat (as platform/service fee)\n\nPayments will be processed on a monthly basis, subject to minimum payout thresholds and applicable fees.`}
                      className="mt-1 min-h-[150px]"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ip-section">5. Intellectual Property</Label>
                    <Textarea 
                      id="ip-section"
                      value={intellectualProperty}
                      onChange={(e) => setIntellectualProperty(e.target.value)}
                      className="mt-1 min-h-[150px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="term-section">6. Term & Termination</Label>
                    <Textarea 
                      id="term-section"
                      value={termination}
                      onChange={(e) => setTermination(e.target.value)}
                      className="mt-1 min-h-[150px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confidentiality-section">7. Confidentiality</Label>
                    <Textarea 
                      id="confidentiality-section"
                      value={confidentiality}
                      onChange={(e) => setConfidentiality(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="liability-section">8. Limitation of Liability</Label>
                    <Textarea 
                      id="liability-section"
                      value={liability}
                      onChange={(e) => setLiability(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="law-section">9. Governing Law</Label>
                    <Textarea 
                      id="law-section"
                      value={governingLaw}
                      onChange={(e) => setGoverningLaw(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="agreement-section">10. Entire Agreement</Label>
                    <Textarea 
                      id="agreement-section"
                      value={entireAgreement}
                      onChange={(e) => setEntireAgreement(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                </div>
                
                <p><strong>IN WITNESS WHEREOF</strong>, the parties have executed this Agreement as of the Effective Date.</p>
                
                <div className="flex justify-between">
                  <div>
                    <p><strong>HyperChat Technologies Pvt. Ltd.</strong></p>
                    <p>By: <strong>Ankit Kumar</strong></p>
                    <p>Title: <strong>Founder</strong></p>
                    <p>Date: _________________________</p>
                  </div>
                  
                  <div>
                    <p><strong>{name || "[Streamer Name]"}</strong></p>
                    <p>Signature: _________________________</p>
                    <p>Date: _________________________</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">1. Purpose</h2>
                <p>{purpose}</p>
                
                <h2 className="text-lg font-semibold">2. Grant of Access</h2>
                <p>{grantOfAccess}</p>
                
                <h2 className="text-lg font-semibold">3. Streamer Responsibilities</h2>
                <p className="whitespace-pre-line">{responsibilities}</p>
                
                <h2 className="text-lg font-semibold">4. Revenue Sharing</h2>
                <ul className="list-disc pl-5">
                  <li><strong>{streamerCut}%</strong> to the Streamer</li>
                  <li><strong>{hyperChatCut}%</strong> to HyperChat (as platform/service fee)</li>
                </ul>
                <p>Payments will be processed on a monthly basis, subject to minimum payout thresholds and applicable fees.</p>
                
                <h2 className="text-lg font-semibold">5. Intellectual Property</h2>
                <p className="whitespace-pre-line">{intellectualProperty}</p>
                
                <h2 className="text-lg font-semibold">6. Term & Termination</h2>
                <p className="whitespace-pre-line">{termination}</p>
                
                <h2 className="text-lg font-semibold">7. Confidentiality</h2>
                <p>{confidentiality}</p>
                
                <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
                <p>{liability}</p>
                
                <h2 className="text-lg font-semibold">9. Governing Law</h2>
                <p>{governingLaw}</p>
                
                <h2 className="text-lg font-semibold">10. Entire Agreement</h2>
                <p>{entireAgreement}</p>
                
                <p><strong>IN WITNESS WHEREOF</strong>, the parties have executed this Agreement as of the Effective Date.</p>
                
                <div className="flex justify-between">
                  <div>
                    <p><strong>HyperChat Technologies Pvt. Ltd.</strong></p>
                    <p>By: <strong>Ankit Kumar</strong></p>
                    <p>Title: <strong>Founder</strong></p>
                    <p>Date: _________________________</p>
                  </div>
                  
                  <div>
                    <p><strong>{name || "[Streamer Name]"}</strong></p>
                    <p>Signature: _________________________</p>
                    <p>Date: _________________________</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            variant="outline"  
            onClick={() => onOpenChange(false)}
            className="sm:order-1"
          >
            Close
          </Button>
          
          <Button 
            variant="default"
            onClick={handleDownloadContract}
            className="sm:order-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Draft
          </Button>
          
          {!previewMode && (
            <Button 
              onClick={handleSaveContract}
              disabled={isSaving}
              className="sm:order-3"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Template"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditableContractDialog;
