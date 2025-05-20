
import jsPDF from 'jspdf';

export interface ReceiptData {
  name: string;
  amount: number;
  orderId: string;
  donationType: string;
  date: string;
}

/**
 * Generates a downloadable PDF receipt for a donation
 */
export const generateReceipt = (data: ReceiptData): void => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  // Set background color
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.rect(0, 0, 210, 297, 'F');

  // Add header
  doc.setFillColor(239, 68, 68); // Red header
  doc.rect(0, 0, 148, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('HyperChat - Donation Receipt', 10, 12);

  // Add content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);

  // Draw donation details
  const yStart = 30;
  const lineHeight = 10;
  
  doc.text(`Donation for: ${formatStreamerName(data.donationType)}`, 10, yStart);
  doc.text(`Name: ${data.name}`, 10, yStart + lineHeight);
  doc.text(`Amount: ₹${data.amount.toLocaleString()}`, 10, yStart + lineHeight * 2);
  doc.text(`Order ID: ${data.orderId}`, 10, yStart + lineHeight * 3);
  doc.text(`Date: ${data.date}`, 10, yStart + lineHeight * 4);

  // Add thank you message
  doc.setFontSize(14);
  doc.text('Thank you for your donation!', 10, yStart + lineHeight * 6);
  doc.setFontSize(11);
  doc.text('Your support helps your favorite streamers create amazing content.', 10, yStart + lineHeight * 7);

  // Add footer
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('HyperChat Donation Platform', 10, 140);
  doc.text('This is an electronically generated receipt.', 10, 145);

  // Save the PDF with filename based on order ID
  doc.save(`donation-receipt-${data.orderId}.pdf`);
};

/**
 * Format the streamer name for display in the receipt
 */
const formatStreamerName = (donationType: string): string => {
  switch (donationType) {
    case 'ankit':
      return 'Ankit';
    case 'harish':
      return 'Harish';
    case 'mackle':
      return 'Mackle';
    case 'rakazone':
      return 'Rakazone Gaming';
    case 'reckoning':
      return 'Reckoning Esports';
    default:
      return donationType.charAt(0).toUpperCase() + donationType.slice(1);
  }
};
