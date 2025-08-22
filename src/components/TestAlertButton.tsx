import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestAlertButtonProps {
  streamerId: string;
  disabled?: boolean;
}

const TestAlertButton: React.FC<TestAlertButtonProps> = ({ streamerId, disabled = false }) => {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestAlert = async () => {
    setIsTesting(true);
    try {
      // Create a test donation entry that will trigger the alert
      const testDonation = {
        streamer_id: streamerId,
        name: 'Test Alert',
        amount: 1,
        message: 'Working',
        payment_status: 'success',
        payment_id: `test-${Date.now()}`,
        is_test: true, // Mark as test to avoid affecting real stats
      };

      const { error } = await supabase
        .from('chia_gaming_donations')
        .insert(testDonation);

      if (error) throw error;

      toast({
        title: "Test Alert Sent! 🎉",
        description: "Check your OBS alerts - you should see a 'Working' message",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || 'Failed to send test alert',
        variant: "destructive",
      });
    }
    setIsTesting(false);
  };

  return (
    <div className="light-button">
      <button 
        className="bt"
        onClick={handleTestAlert}
        disabled={disabled || isTesting}
        style={{ position: 'relative', height: '120px', display: 'flex', alignItems: 'flex-end', outline: 'none', background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <div 
          className="light-holder"
          style={{ position: 'absolute', height: '120px', width: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div 
            className="dot"
            style={{ position: 'absolute', top: 0, width: '8px', height: '8px', backgroundColor: 'hsl(var(--muted))', borderRadius: '50%', zIndex: 2 }}
          />
          <div 
            className="light"
            style={{ 
              position: 'absolute', 
              top: 0, 
              width: '120px', 
              height: '120px', 
              clipPath: 'polygon(50% 0%, 25% 100%, 75% 100%)',
              background: isTesting ? 'linear-gradient(180deg, hsl(var(--primary)) 0%, rgba(255, 255, 255, 0) 75%, rgba(255, 255, 255, 0) 100%)' : 'transparent',
              transition: 'background 300ms'
            }}
          />
        </div>
        <div 
          className="button-holder"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '60px', 
            width: '80px', 
            backgroundColor: 'hsl(var(--card))', 
            borderRadius: '8px', 
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            fontSize: '12px',
            transition: 'all 300ms',
            border: '2px solid hsl(var(--border))',
            ...(isTesting && {
              color: 'hsl(var(--primary))',
              borderColor: 'hsl(var(--primary))',
              transform: 'translateY(-2px)'
            })
          }}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              marginBottom: '4px',
              fill: isTesting ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              transition: 'fill 300ms'
            }}
          >
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
          <span style={{ lineHeight: '1' }}>
            {isTesting ? 'Testing...' : 'Test Alert'}
          </span>
        </div>
      </button>
    </div>
  );
};

export default TestAlertButton;