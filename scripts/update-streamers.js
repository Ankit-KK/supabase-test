// Script to bulk update streamer pages 21-46
// This file documents the changes needed for consistency

const streamers = Array.from({ length: 26 }, (_, i) => i + 21); // 21 to 46

const changes = {
  imports: `import { PhoneDialog } from '@/components/PhoneDialog';`,
  states: `
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');`,
  
  validateFunction: `
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\\d{9}$/;
    return phoneRegex.test(phone);
  };`,
  
  handleSubmit: `
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    setPhoneError('');
    setShowPhoneDialog(true);
  };`,
  
  handlePayment: (num) => `
  const handlePaymentWithPhone = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    setIsSubmitting(true);
    setShowPhoneDialog(false);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order-streamer${num}', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: formData.message,
          voiceBlob: voiceBlob,
          emoji: formData.emoji,
          phone: phoneNumber,
        },
      });

      if (error) throw error;

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: \`\${window.location.origin}/streamer${num}\`,
      };

      if (cashfree) {
        cashfree.checkout(checkoutOptions);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };`,
  
  dialog: (color) => `
        <PhoneDialog
          open={showPhoneDialog}
          onOpenChange={setShowPhoneDialog}
          phoneNumber={phoneNumber}
          onPhoneChange={(phone) => {
            setPhoneNumber(phone);
            setPhoneError('');
          }}
          phoneError={phoneError}
          onContinue={handlePaymentWithPhone}
          isSubmitting={isSubmitting}
          buttonColor="${color}"
        />`
};

console.log(`Update needed for streamers:`, streamers.join(', '));
console.log('Pattern established - manual updates required for each file.');
