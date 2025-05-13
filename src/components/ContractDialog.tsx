
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Pencil, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamerName: string;
  streamerType: string;
  onContractSigned?: () => void;
}

// Define the contract data type to include the revenue cut properties
interface StreamerContractData {
  id: string;
  streamer_type: string;
  streamer_name: string;
  signature: string;
  agreed_to_terms: boolean;
  signed_at: string;
  streamer_cut: number;
  hyperchat_cut: number;
}

const ContractDialog: React.FC<ContractDialogProps> = ({ 
  open, 
  onOpenChange,
  streamerName,
  streamerType,
  onContractSigned
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(streamerName);
  const [signature, setSignature] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const navigate = useNavigate();
  const contractContentRef = useRef<HTMLDivElement>(null);
  
  // Revenue sharing state
  const [showCutsDialog, setShowCutsDialog] = useState(false);
  const [streamerCut, setStreamerCut] = useState(80);
  const [hyperChatCut, setHyperChatCut] = useState(20);
  
  // Skip signature option
  const [skipSignature, setSkipSignature] = useState(false);

  // Check if contract is already signed
  useEffect(() => {
    const checkContractStatus = async () => {
      if (!open) return;
      
      try {
        const { data, error } = await supabase
          .from("streamer_contracts")
          .select("*")
          .eq("streamer_type", streamerType)
          .single();
        
        if (data) {
          setIsSigned(true);
          setName(data.streamer_name);
          setSignature(data.signature);
          
          // Set revenue sharing values
          if (data.streamer_cut !== null && data.hyperchat_cut !== null) {
            setStreamerCut(data.streamer_cut);
            setHyperChatCut(data.hyperchat_cut);
          }
        }
      } catch (error) {
        console.error("Error checking contract status:", error);
      }
    };

    checkContractStatus();
  }, [open, streamerType]);

  // Handle mouse events for signature canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling when drawing
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Save the signature as data URL
    const dataUrl = canvas.toDataURL("image/png");
    setSignature(dataUrl);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature("");
    }
  };

  const handleSignContract = async () => {
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name to sign the contract",
        variant: "destructive",
      });
      return;
    }

    // Check if signature is required and available
    if (!skipSignature && !signature) {
      toast({
        title: "Signature is required",
        description: "Please sign the contract using the signature pad or check the 'Skip signature' option",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Agreement required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSigning(true);

      // Save the contract to the database
      const { data, error } = await supabase
        .from("streamer_contracts")
        .upsert([
          {
            streamer_type: streamerType,
            streamer_name: name,
            signature: skipSignature ? "Name Only: " + name : signature,
            agreed_to_terms: true,
            signed_at: new Date().toISOString(),
            streamer_cut: streamerCut,
            hyperchat_cut: hyperChatCut
          }
        ], { onConflict: "streamer_type" });

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      setIsSigned(true);
      if (onContractSigned) {
        onContractSigned();
      }
      
      toast({
        title: "Contract signed successfully",
        description: "Thank you for signing the agreement",
      });
    } catch (error) {
      console.error("Error signing contract:", error);
      toast({
        title: "Error signing contract",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadContract = () => {
    // Get current date for the contract
    const currentDate = new Date().toLocaleDateString();
    
    toast({
      title: "Preparing PDF",
      description: "Generating your contract PDF...",
    });
    
    // Create a complete contract HTML with smaller font size and reduced line spacing
    const contractHTML = `
      <div style="font-family: Arial, sans-serif; padding: 30px; color: #000; background-color: #fff; font-size: 10px; line-height: 1.3;">
        <h1 style="text-align: center; font-size: 16px; margin-bottom: 15px;">HyperChat Streamer Agreement</h1>
        
        <p><strong>This Agreement</strong> ("Agreement") is entered into by and between:</p>
        
        <p style="margin-bottom: 10px;">
          <strong>HyperChat Technologies Pvt. Ltd.</strong>, a registered MSME under Udyam Registration No. <strong>UP29D0047796</strong>, with its principal office at <strong>Ghaziabad</strong>,<br>
          and<br>
          <strong>${name}</strong>,<br>
          collectively referred to as the "Parties".
        </p>
        
        <p><strong>Effective Date:</strong> ${currentDate}</p>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">1. Purpose</h2>
        <p>HyperChat provides a fan engagement and donation tool designed for live streamers. This Agreement outlines the terms under which the Streamer may access and use the HyperChat platform.</p>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">2. Grant of Access</h2>
        <p>HyperChat grants the Streamer a non-exclusive, non-transferable license to use its platform for the purpose of enhancing live streams and enabling fan support through premium messages, real-time reactions, and related features.</p>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">3. Streamer Responsibilities</h2>
        <p>The Streamer agrees to:</p>
        <ul style="margin-left: 15px; margin-bottom: 10px; padding-left: 0;">
          <li>Integrate HyperChat into their live streaming sessions (e.g., Twitch, YouTube, Kick, etc.).</li>
          <li>Maintain an active and respectful community environment.</li>
          <li>Not misuse the platform for offensive, illegal, or prohibited content.</li>
        </ul>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">4. Revenue Sharing</h2>
        <p>If HyperChat includes monetized features (e.g., donations, premium messages), revenue will be shared as follows unless otherwise agreed:</p>
        <ul style="margin-left: 15px; margin-bottom: 10px; padding-left: 0;">
          <li><strong>${streamerCut}%</strong> to the Streamer</li>
          <li><strong>${hyperChatCut}%</strong> to HyperChat (as platform/service fee)</li>
        </ul>
        <p>Payments will be processed on a monthly basis, subject to minimum payout thresholds and applicable fees.</p>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">5. Intellectual Property</h2>
        <ul style="margin-left: 15px; margin-bottom: 10px; padding-left: 0;">
          <li>All platform content, branding, and underlying software remain the sole property of HyperChat.</li>
          <li>The Streamer retains rights to their own content but grants HyperChat permission to feature their stream/channel for promotional use (with prior notice).</li>
        </ul>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">6. Term & Termination</h2>
        <ul style="margin-left: 15px; margin-bottom: 10px; padding-left: 0;">
          <li>This Agreement begins on the Effective Date and continues until terminated by either party with <strong>7 days' written notice</strong>.</li>
          <li>HyperChat reserves the right to suspend or terminate access for violations of terms, abuse of service, or unlawful activity.</li>
        </ul>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">7. Confidentiality</h2>
        <p>The Streamer agrees not to disclose any non-public information about HyperChat, including platform features under development, financial terms, or internal strategies.</p>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">8. Limitation of Liability</h2>
        <p>HyperChat shall not be liable for indirect, incidental, or consequential damages arising from the use of its platform.</p>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">9. Governing Law</h2>
        <p>This Agreement shall be governed by the laws of <strong>India</strong>, and any disputes shall be resolved in the courts of that jurisdiction.</p>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">10. Entire Agreement</h2>
        <p>This Agreement constitutes the entire understanding between the parties and supersedes any prior agreements or understandings.</p>
        
        <h2 style="font-size: 12px; margin-top: 12px; margin-bottom: 8px;">IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.</h2>
        
        <div style="margin-top: 25px; display: flex; justify-content: space-between;">
          <div>
            <strong>HyperChat Technologies Pvt. Ltd.</strong><br>
            By: <strong>Ankit Kumar</strong><br>
            Title: <strong>Founder</strong><br>
            Date: ${currentDate}
          </div>
          
          <div style="margin-left: 40px;">
            <strong>${name}</strong><br>
            ${skipSignature ? "Name Only (No Signature)" : "Digital Signature"}<br>
            Date: ${currentDate}
          </div>
        </div>
      </div>
    `;
    
    // Create a temporary container for the contract content
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = contractHTML;
    document.body.appendChild(tempContainer);
    
    // Use html2canvas with optimized scale settings
    html2canvas(tempContainer, {
      scale: 2, // Higher scale for better quality
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 800, // Set fixed width for consistent rendering
      onclone: (clonedDoc) => {
        // Force rendering styles in the cloned document
        const contract = clonedDoc.querySelector('div');
        if (contract) {
          contract.style.width = '800px';
          contract.style.display = 'block';
          contract.style.visibility = 'visible';
          contract.style.opacity = '1';
        }
      }
    }).then(canvas => {
      // Remove the temporary container
      document.body.removeChild(tempContainer);
      
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
      
      // Add signature on a separate page if available
      if (signature && !skipSignature) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Signature Page', 105, 20, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.text('HyperChat Technologies Pvt. Ltd.', 20, 40);
        pdf.text('By: Ankit Kumar', 20, 50);
        pdf.text('Title: Founder', 20, 60);
        pdf.text(`Date: ${currentDate}`, 20, 70);
        
        pdf.text(`${name}`, 20, 100);
        
        // Add signature image
        pdf.addImage(signature, 'PNG', 20, 110, 50, 20);
        
        pdf.text(`Date: ${currentDate}`, 20, 140);
      }
      
      // Save the PDF
      pdf.save(`HyperChat_${streamerType}_Agreement_${currentDate.replace(/\//g, '-')}.pdf`);
      
      toast({
        title: "Contract downloaded",
        description: "The signed agreement has been downloaded as a PDF",
      });
    }).catch(error => {
      console.error("Error generating PDF:", error);
      // Fallback to text download if PDF generation fails
      downloadTextContract(getContractText(name, currentDate), currentDate);
    });
  };

  const downloadTextContract = (contractText: string, currentDate: string) => {
    const element = document.createElement('a');
    const file = new Blob([contractText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `HyperChat_${streamerType}_Agreement_${currentDate.replace(/\//g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Contract downloaded as text",
      description: "The signed agreement has been downloaded as a text file",
    });
  };

  const getContractText = (streamerName: string, date: string) => {
    return `# HyperChat Streamer Agreement

**This Agreement** ("Agreement") is entered into by and between:

**HyperChat Technologies Pvt. Ltd.**, a registered MSME under Udyam Registration No. **UP29D0047796**, with its principal office at **Ghaziabad**,  
and  
**${streamerName}**,  
collectively referred to as the "Parties".

**Effective Date:** ${date}

---

## 1. Purpose

HyperChat provides a fan engagement and donation tool designed for live streamers. This Agreement outlines the terms under which the Streamer may access and use the HyperChat platform.

---

## 2. Grant of Access

HyperChat grants the Streamer a non-exclusive, non-transferable license to use its platform for the purpose of enhancing live streams and enabling fan support through premium messages, real-time reactions, and related features.

---

## 3. Streamer Responsibilities

The Streamer agrees to:
- Integrate HyperChat into their live streaming sessions (e.g., Twitch, YouTube, Kick, etc.).
- Maintain an active and respectful community environment.
- Not misuse the platform for offensive, illegal, or prohibited content.

---

## 4. Revenue Sharing

If HyperChat includes monetized features (e.g., donations, premium messages), revenue will be shared as follows unless otherwise agreed:

- **${streamerCut}%** to the Streamer  
- **${hyperChatCut}%** to HyperChat (as platform/service fee)

Payments will be processed on a monthly basis, subject to minimum payout thresholds and applicable fees.

---

## 5. Intellectual Property

- All platform content, branding, and underlying software remain the sole property of HyperChat.
- The Streamer retains rights to their own content but grants HyperChat permission to feature their stream/channel for promotional use (with prior notice).

---

## 6. Term & Termination

- This Agreement begins on the Effective Date and continues until terminated by either party with **7 days' written notice**.
- HyperChat reserves the right to suspend or terminate access for violations of terms, abuse of service, or unlawful activity.

---

## 7. Confidentiality

The Streamer agrees not to disclose any non-public information about HyperChat, including platform features under development, financial terms, or internal strategies.

---

## 8. Limitation of Liability

HyperChat shall not be liable for indirect, incidental, or consequential damages arising from the use of its platform.

---

## 9. Governing Law

This Agreement shall be governed by the laws of **India**, and any disputes shall be resolved in the courts of that jurisdiction.

---

## 10. Entire Agreement

This Agreement constitutes the entire understanding between the parties and supersedes any prior agreements or understandings.

---

## IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

**HyperChat Technologies Pvt. Ltd.**  
By: **Ankit Kumar**  
Title: **Founder**  
Date: ${date}  

**${streamerName}**  
${skipSignature ? "Name Only (No Signature Applied)" : "Signature: [Digital Signature Applied]"}  
Date: ${date}  
`;
  };
  
  // Function to handle revenue sharing changes
  const handleCutChange = (newStreamerCut: number) => {
    setStreamerCut(newStreamerCut);
    setHyperChatCut(100 - newStreamerCut);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        // Prevent closing the dialog if the contract is being signed
        if (isSigning) return;
        onOpenChange(newOpen);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              HyperChat Streamer Agreement
            </DialogTitle>
            <DialogDescription>
              Please review the agreement carefully before signing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCutsDialog(true)}
                className="mb-2"
              >
                <Scissors className="mr-2 h-4 w-4" />
                Adjust Revenue Sharing
              </Button>
            </div>
            
            <div ref={contractContentRef} className="border rounded-md p-4 h-60 overflow-auto prose prose-sm dark:prose-invert">
              <h1>HyperChat Streamer Agreement</h1>
              
              <p><strong>This Agreement</strong> ("Agreement") is entered into by and between:</p>
              
              <p>
                <strong>HyperChat Technologies Pvt. Ltd.</strong>, a registered MSME under Udyam Registration No. <strong>UP29D0047796</strong>, with its principal office at <strong>Ghaziabad</strong>,<br />
                and<br />
                <strong>{isSigned ? name : "[Streamer Name]"}</strong>,<br />
                collectively referred to as the "Parties".
              </p>
              
              <p><strong>Effective Date:</strong> {isSigned ? new Date().toLocaleDateString() : "[Insert Date]"}</p>
              
              <h2>1. Purpose</h2>
              <p>HyperChat provides a fan engagement and donation tool designed for live streamers. This Agreement outlines the terms under which the Streamer may access and use the HyperChat platform.</p>
              
              <h2>2. Grant of Access</h2>
              <p>HyperChat grants the Streamer a non-exclusive, non-transferable license to use its platform for the purpose of enhancing live streams and enabling fan support through premium messages, real-time reactions, and related features.</p>
              
              <h2>3. Streamer Responsibilities</h2>
              <p>The Streamer agrees to:</p>
              <ul>
                <li>Integrate HyperChat into their live streaming sessions (e.g., Twitch, YouTube, Kick, etc.).</li>
                <li>Maintain an active and respectful community environment.</li>
                <li>Not misuse the platform for offensive, illegal, or prohibited content.</li>
              </ul>
              
              <h2>4. Revenue Sharing</h2>
              <p>If HyperChat includes monetized features (e.g., donations, premium messages), revenue will be shared as follows unless otherwise agreed:</p>
              <ul>
                <li><strong>{streamerCut}%</strong> to the Streamer</li>
                <li><strong>{hyperChatCut}%</strong> to HyperChat (as platform/service fee)</li>
              </ul>
              <p>Payments will be processed on a monthly basis, subject to minimum payout thresholds and applicable fees.</p>
              
              <h2>5. Intellectual Property</h2>
              <ul>
                <li>All platform content, branding, and underlying software remain the sole property of HyperChat.</li>
                <li>The Streamer retains rights to their own content but grants HyperChat permission to feature their stream/channel for promotional use (with prior notice).</li>
              </ul>
              
              <h2>6. Term & Termination</h2>
              <ul>
                <li>This Agreement begins on the Effective Date and continues until terminated by either party with <strong>7 days' written notice</strong>.</li>
                <li>HyperChat reserves the right to suspend or terminate access for violations of terms, abuse of service, or unlawful activity.</li>
              </ul>
              
              <h2>7. Confidentiality</h2>
              <p>The Streamer agrees not to disclose any non-public information about HyperChat, including platform features under development, financial terms, or internal strategies.</p>
              
              <h2>8. Limitation of Liability</h2>
              <p>HyperChat shall not be liable for indirect, incidental, or consequential damages arising from the use of its platform.</p>
              
              <h2>9. Governing Law</h2>
              <p>This Agreement shall be governed by the laws of <strong>India</strong>, and any disputes shall be resolved in the courts of that jurisdiction.</p>
              
              <h2>10. Entire Agreement</h2>
              <p>This Agreement constitutes the entire understanding between the parties and supersedes any prior agreements or understandings.</p>
              
              <h2>IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.</h2>
              
              <p>
                <strong>HyperChat Technologies Pvt. Ltd.</strong><br />
                By: <strong>Ankit Kumar</strong><br />
                Title: <strong>Founder</strong><br />
                Date: _________________________
              </p>
              
              <p>
                <strong>{isSigned ? name : "[Streamer Name]"}</strong><br />
                Signature: _____________________<br />
                Date: _________________________
              </p>
            </div>
            
            {!isSigned && (
              <>
                <div>
                  <Label htmlFor="streamer-name">Full Name</Label>
                  <Input 
                    id="streamer-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skip-signature" 
                    checked={skipSignature} 
                    onCheckedChange={(checked) => {
                      setSkipSignature(checked === true);
                      if (checked === true) {
                        clearSignature();
                      }
                    }} 
                  />
                  <Label htmlFor="skip-signature" className="text-sm">
                    I prefer to use my name instead of drawing a signature
                  </Label>
                </div>
                
                {!skipSignature && (
                  <div>
                    <Label htmlFor="signature">Signature (Required)</Label>
                    <div className="border rounded-md p-2 bg-white dark:bg-slate-900 mt-1">
                      <canvas 
                        ref={canvasRef}
                        width={570}
                        height={150}
                        className="w-full h-[150px] border rounded cursor-crosshair bg-white dark:bg-gray-100"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={clearSignature}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Clear Signature
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms} 
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)} 
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I have read and agree to the terms and conditions
                  </Label>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {isSigned ? (
              <Button 
                className="w-full sm:w-auto" 
                onClick={handleDownloadContract}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF Contract
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSigning}
                >
                  Cancel
                </Button>
                <Button 
                  className="w-full sm:w-auto" 
                  onClick={handleSignContract}
                  disabled={isSigning || !name || (!skipSignature && !signature) || !agreedToTerms}
                >
                  {isSigning ? "Processing..." : "Sign Contract"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Revenue Sharing Dialog */}
      <AlertDialog open={showCutsDialog} onOpenChange={setShowCutsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust Revenue Sharing</AlertDialogTitle>
            <AlertDialogDescription>
              Set the percentage split between streamer and HyperChat
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="space-y-6">
              <div>
                <Label htmlFor="streamer-cut">Streamer: {streamerCut}%</Label>
                <Input
                  id="streamer-cut"
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={streamerCut}
                  onChange={(e) => handleCutChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="hyperchat-cut">HyperChat: {hyperChatCut}%</Label>
                <Input
                  id="hyperchat-cut"
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={hyperChatCut}
                  onChange={(e) => {
                    const newHyperChatCut = parseInt(e.target.value);
                    setHyperChatCut(newHyperChatCut);
                    setStreamerCut(100 - newHyperChatCut);
                  }}
                  className="w-full"
                  disabled
                />
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowCutsDialog(false)}>Apply Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContractDialog;
