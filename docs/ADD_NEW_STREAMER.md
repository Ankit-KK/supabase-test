# Adding a New Streamer — Complete Guide

Replace these placeholders throughout:

| Placeholder | Example | Description |
|---|---|---|
| `[SLUG]` | `shadow_x` | Snake_case identifier (used everywhere) |
| `[NAME]` | `ShadowX` | Display name (spaces allowed, e.g. `Shadow X`) |
| `[COLOR]` | `#ff6b35` | Brand hex color |
| `[PREFIX]` | `sx_rp_` | Razorpay order prefix (unique, 2-3 chars + `_rp_`) |
| `[TABLE_ID]` | `11` | Next smallint — see "How to pick TABLE_ID" below |
| `[PASCAL]` | `ShadowX` | PascalCase for component names |
| `[LOGO_FILE]` | `shadow-x-logo.png` | Logo filename (kebab-case) |
| `[BG_FILE]` | `shadow-x-background.png` | Background filename |
| `[CARD_BG_FILE]` | `shadow-x-card-bg.jpg` | Card background filename |
| `[MAIN_BG_FILE]` | `shadow-x-main-banner.jpg` | Main page background filename |
| `[TW_COLOR]` | `amber-500` | Tailwind color class (no `#`, no prefix like `text-`/`border-`) |
| `[TW_COLOR_DARK]` | `amber-600` | Darker Tailwind variant for gradients |
| `[TW_COLOR_LIGHT]` | `amber-400` | Lighter Tailwind variant for gradients/glows |

### How to pick `[TABLE_ID]`

Open `src/config/streamers.ts` → find `DONATION_TABLE_ID_MAP`. The current highest key is `10` (demigod). Use the next integer: **`11`**. After adding, update this note for the next person.

Current mapping (as of March 2026):
```
0=ankit, 1=chiaa_gaming, 2=looteriya_gaming, 3=clumsy_god, 4=wolfy,
5=dorp_plays, 6=zishu, 7=brigzard, 8=w_era, 9=mr_champion, 10=demigod
```

### How to pick `[PREFIX]`

Must be unique across all streamers. Check `STREAMER_CONFIGS` in `src/config/streamers.ts` for existing prefixes. Format: 2-3 letter abbreviation + `_rp_` (e.g., `sx_rp_`).

---

## STEP 1: Database — Create Donations Table + RLS + View

```sql
CREATE TABLE public.[SLUG]_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  amount_inr numeric,
  currency varchar DEFAULT 'INR',
  message text,
  voice_message_url text,
  temp_voice_data text,
  tts_audio_url text,
  hypersound_url text,
  media_url text,
  media_type text,
  order_id text,
  razorpay_order_id text,
  status_token_hash text,
  payment_status text DEFAULT 'pending',
  moderation_status text DEFAULT 'pending',
  is_hyperemote boolean DEFAULT false,
  message_visible boolean DEFAULT true,
  mod_notified boolean DEFAULT false,
  approved_by text,
  approved_at timestamptz,
  audio_scheduled_at timestamptz,
  audio_played_at timestamptz,
  streamer_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.[SLUG]_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved [SLUG] donations"
  ON public.[SLUG]_donations FOR SELECT TO anon, authenticated
  AS RESTRICTIVE USING (
    moderation_status IN ('approved', 'auto_approved')
    AND payment_status = 'success'
  );

CREATE POLICY "Service role can manage [SLUG] donations"
  ON public.[SLUG]_donations FOR ALL TO service_role
  AS RESTRICTIVE USING (true) WITH CHECK (true);

-- Public view
CREATE VIEW public.[SLUG]_donations_public
  WITH (security_invoker = on) AS
  SELECT id, name, amount, currency, message, message_visible,
         is_hyperemote, hypersound_url, tts_audio_url,
         voice_message_url, created_at
  FROM public.[SLUG]_donations;
```

> **Note:** `amount_inr` is included in the table creation. It is populated automatically by `create-razorpay-order-unified` at order creation time and by `razorpay-webhook` / `check-payment-status-unified` at payment confirmation time. No separate migration needed.

---

## STEP 2: Database — Insert Streamer Record

```sql
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, user_id)
VALUES ('[SLUG]', '[NAME]', '[COLOR]', NULL);
```

---

## STEP 3: Edge Function — `create-razorpay-order-unified`

Add to `STREAMER_CONFIG` map (~line 10):

```typescript
'[SLUG]': { table: '[SLUG]_donations', prefix: '[PREFIX]', tableId: [TABLE_ID] },
```

> **Deployment:** Edge functions auto-deploy on save in Lovable. If editing outside Lovable, deploy manually via `supabase functions deploy create-razorpay-order-unified`.

---

## STEP 4: Edge Function — `check-payment-status-unified`

Add to `STREAMER_CONFIG` map (~line 20):

```typescript
'[SLUG]': { table: '[SLUG]_donations', prefix: '[PREFIX]' },
```

---

## STEP 5: Edge Function — `get-current-audio`

Add to `STREAMER_TABLE_MAP` (~line 10):

```typescript
'[SLUG]': '[SLUG]_donations',
```

Add to `STREAMER_CHANNEL_MAP` (~line 25):

```typescript
'[SLUG]': '[SLUG]-alerts',
```

> ⚠️ **Without this, the Media Source audio player and OBS alerts will NOT work.**

---

### How "🎧 Media Source Audio (Alternative)" Works

The streamer's **dashboard** (`OBSTokenManager` component) automatically shows a
"🎧 Media Source Audio (Alternative)" section once the streamer has an active OBS token.

This provides:
- A **Media Source URL** in the format:
  `{SUPABASE_FUNCTIONS_BASE}/get-current-audio?token={OBS_TOKEN}`
- **OBS Setup Instructions** for streamers to configure a Media Source instead of Browser Source

**How it works:**
1. Streamer copies the Media Source URL from their dashboard
2. In OBS, they add a **Media Source** (not Browser Source)
3. They uncheck "Local File" and paste the URL
4. OBS polls the `get-current-audio` edge function
5. The edge function checks the streamer's donation table for unplayed audio
6. If audio is found → returns a **302 redirect** to the static R2 audio file
7. If no audio → returns **204 No Content**

**What enables it (no extra per-streamer code needed):**
- ✅ Step 5 mappings in `get-current-audio` (`STREAMER_TABLE_MAP` + `STREAMER_CHANNEL_MAP`)
- ✅ Streamer has generated an OBS token from their dashboard
- The UI is built into the shared `OBSTokenManager` component automatically

**OBS Settings (Critical):**
- ✅ Enable "Restart playback when source becomes active"
- ✅ Enable "Close file when inactive"
- ✅ Set "Network Buffering" to **2 MB or above** (do NOT set to 0 — it will crash OBS)
- 💡 Use Advanced Scene Switcher plugin to auto-reload the source every 3-5 seconds

---

## STEP 6: Edge Function — `razorpay-webhook`

Add to `DONATION_TABLE_ID_MAP` (~line 18):

```typescript
[TABLE_ID]: '[SLUG]_donations',
```

Add to `TABLE_TO_SLUG` (~line 26):

```typescript
'[SLUG]_donations': '[SLUG]',
```

---

## STEP 7: Edge Function — `moderate-donation`

Add table name to `ALLOWED_DONATION_TABLES` array (~line 243):

```typescript
'[SLUG]_donations',
```

---

## STEP 8: Frontend — `src/config/streamers.ts`

### 8A: Add to `STREAMER_CONFIGS`

```typescript
[SLUG]: {
  slug: '[SLUG]', name: '[NAME]', tableName: '[SLUG]_donations', brandColor: '[COLOR]',
  pusherDashboardChannel: '[SLUG]-dashboard', pusherGoalChannel: '[SLUG]-goal',
  pusherAudioChannel: '[SLUG]-audio', pusherAlertsChannel: '[SLUG]-alerts',
  pusherSettingsChannel: '[SLUG]-settings', razorpayOrderPrefix: '[PREFIX]',
},
```

### 8B: Add to `DONATION_TABLE_ID_MAP`

```typescript
[TABLE_ID]: '[SLUG]_donations',
```

---

## STEP 9: Frontend — `src/config/donationPageConfigs.ts` (optional)

> **Note:** This config file exists but is **not used by any current donation page**. All pages are standalone. You may add an entry here for future reference, but it has no functional effect.

```typescript
[SLUG]: {
  streamerSlug: '[SLUG]',
  streamerName: '[NAME]',
  brandColor: '[COLOR]',
  logoSrc: '/assets/streamers/[LOGO_FILE]',
  backgroundSrc: '/assets/streamers/[BG_FILE]',
  edgeFunctionName: 'create-razorpay-order-unified',
  themeDescription: 'Support [NAME] with your donation',
},
```

---

## STEP 10: Create 5 Page Files

### 10A: Donation Page — `src/pages/[PASCAL].tsx`

All streamer donation pages are standalone custom pages. There is no shared wrapper component — each page is self-contained.

**Create `src/pages/[PASCAL].tsx`** with the following complete code. Before pasting, do a global find-and-replace for each placeholder.

**Required assets** (add to `src/assets/`):
- `[LOGO_FILE]` — Streamer logo
- `[CARD_BG_FILE]` — Card background image
- `[MAIN_BG_FILE]` — Full page background image

```tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import MediaUploader from "@/components/MediaUploader";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
// TODO: Replace these imports with your actual asset files
import streamerLogo from "@/assets/[LOGO_FILE]";
import streamerCardBg from "@/assets/[CARD_BG_FILE]";
import streamerMainBanner from "@/assets/[MAIN_BG_FILE]";
import DonationPageFooter from "@/components/DonationPageFooter";
import RewardsBanner from "@/components/RewardsBanner";

const [PASCAL] = () => {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    message: "",
  });
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<"text" | "voice" | "hypersound" | "media">("text");
  const [selectedHypersound, setSelectedHypersound] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const navigate = useNavigate();

  // Fetch streamer-specific pricing
  const { pricing } = useStreamerPricing('[SLUG]', selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  // Tiered voice duration based on amount (INR): 150-299=8s, 300-499=12s, 500+=15s
  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") {
      if (amount >= 500) return 15;
      if (amount >= 300) return 12;
      return 8;
    }
    if (amount >= 6) return 15;
    if (amount >= 4) return 12;
    return 8;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
      console.log('Razorpay SDK loaded');
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment system is still loading. Please wait.");
      return;
    }

    if (!formData.name || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const minAmount =
      donationType === "voice"
        ? pricing.minVoice
        : donationType === "hypersound"
          ? pricing.minHypersound
          : donationType === "media"
            ? pricing.minMedia
            : pricing.minText;
    if (amount < minAmount) {
      toast.error(`Minimum amount for ${donationType} is ${currencySymbol}${minAmount}`);
      return;
    }

    if (donationType === "voice" && !voiceRecorder.audioBlob) {
      toast.error("Please record a voice message");
      return;
    }

    if (donationType === "hypersound" && !selectedHypersound) {
      toast.error("Please select a sound");
      return;
    }

    if (donationType === "media" && !mediaUrl) {
      toast.error("Please upload a media file");
      return;
    }

    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl: string | null = null;
      if (donationType === "voice" && voiceRecorder.audioBlob) {
        console.log("Uploading voice message before payment...", {
          blobSize: voiceRecorder.audioBlob.size,
          blobType: voiceRecorder.audioBlob.type,
        });

        if (!voiceRecorder.audioBlob || voiceRecorder.audioBlob.size === 0) {
          throw new Error("No voice recording found. Please record your message again.");
        }

        const voiceDataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(",")) {
              reject(new Error("Failed to read voice data"));
              return;
            }
            const base64 = result.split(",")[1];
            console.log("Voice data converted to base64, length:", base64.length);
            resolve(base64);
          };

          reader.onerror = () => {
            reject(new Error("Failed to read voice recording"));
          };

          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          "upload-voice-message-direct",
          {
            body: {
              voiceData: voiceDataBase64,
              streamerSlug: "[SLUG]",
            },
          },
        );

        if (uploadError) {
          console.error("Voice upload error:", uploadError);
          throw new Error("Failed to upload voice message");
        }

        voiceMessageUrl = uploadResult.voice_message_url;
        console.log("Voice message uploaded successfully:", voiceMessageUrl);
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: '[SLUG]',
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: donationType === "text" ? formData.message : null,
          voiceMessageUrl: voiceMessageUrl,
          hypersoundUrl: donationType === "hypersound" ? selectedHypersound : null,
          mediaUrl: donationType === "media" ? mediaUrl : null,
          mediaType: donationType === "media" ? mediaType : null,
          currency: selectedCurrency,
        },
      });

      if (error) throw error;

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: "[NAME]",
        description: "Support [NAME]",
        handler: function (response: any) {
          console.log("Payment successful:", response);
          navigate(`/status?order_id=${data.orderId}&status=success`);
        },
        modal: {
          ondismiss: function () {
            console.log("Payment cancelled");
            navigate(`/status?order_id=${data.orderId}&status=pending`);
          },
        },
        theme: {
          color: "[COLOR]",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDonationTypeChange = (value: "text" | "voice" | "hypersound" | "media") => {
    setDonationType(value);
    if (value === "hypersound") {
      setFormData((prev) => ({ ...prev, amount: String(pricing.minHypersound), message: "" }));
    } else if (value === "voice") {
      setFormData((prev) => ({ ...prev, amount: String(pricing.minVoice), message: "" }));
    } else if (value === "media") {
      setFormData((prev) => ({ ...prev, amount: String(pricing.minMedia), message: "" }));
      setMediaUrl(null);
      setMediaType(null);
    } else {
      setFormData((prev) => ({ ...prev, amount: String(pricing.minText), message: "" }));
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${streamerMainBanner})` }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      <Card
        className="w-full max-w-sm mx-auto bg-card/95 backdrop-blur-sm border-[TW_COLOR]/20 shadow-2xl relative overflow-hidden"
        style={{
          backgroundImage: `url(${streamerCardBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[TW_COLOR]/20 via-[TW_COLOR_DARK]/20 to-[TW_COLOR_LIGHT]/20 opacity-50 blur-xl"></div>

        <CardHeader className="text-center relative z-10 pb-2">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-[TW_COLOR] shadow-xl">
              <img src={streamerLogo} alt="[NAME] Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[TW_COLOR] to-[TW_COLOR_DARK] bg-clip-text text-transparent">
            [NAME]
          </CardTitle>
          <p className="text-muted-foreground text-xs">Support [NAME] with your donation</p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[TW_COLOR]">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-[TW_COLOR]/30 focus:border-[TW_COLOR] focus:ring-[TW_COLOR]/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[TW_COLOR]">Choose your donation type</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("text")}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === "text"
                      ? "border-[TW_COLOR] bg-[TW_COLOR]/10"
                      : "border-[TW_COLOR]/30 hover:border-[TW_COLOR]/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">💬</div>
                    <div className="font-medium text-[10px]">Text</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {currencySymbol}
                      {pricing.minText}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("voice")}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === "voice"
                      ? "border-[TW_COLOR] bg-[TW_COLOR]/10"
                      : "border-[TW_COLOR]/30 hover:border-[TW_COLOR]/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🎤</div>
                    <div className="font-medium text-[10px]">Voice</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {currencySymbol}
                      {pricing.minVoice}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("hypersound")}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === "hypersound"
                      ? "border-[TW_COLOR] bg-[TW_COLOR]/10"
                      : "border-[TW_COLOR]/30 hover:border-[TW_COLOR]/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🔊</div>
                    <div className="font-medium text-[10px]">Sound</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {currencySymbol}
                      {pricing.minHypersound}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("media")}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === "media"
                      ? "border-[TW_COLOR] bg-[TW_COLOR]/10"
                      : "border-[TW_COLOR]/30 hover:border-[TW_COLOR]/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🖼️</div>
                    <div className="font-medium text-[10px]">Media</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {currencySymbol}
                      {pricing.minMedia}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-[TW_COLOR]">
                Amount *
              </label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[100px] justify-between border-[TW_COLOR]/30 hover:bg-[TW_COLOR]/10"
                    >
                      {currencySymbol} {selectedCurrency}
                      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <CommandItem
                              key={currency.code}
                              value={currency.code}
                              onSelect={(value) => {
                                const newCurrency = value.toUpperCase();
                                setSelectedCurrency(newCurrency);
                                setCurrencyOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCurrency === currency.code ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {currency.symbol} {currency.code} - {currency.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  readOnly={donationType === "hypersound"}
                  className={`flex-1 border-[TW_COLOR]/30 focus:border-[TW_COLOR] focus:ring-[TW_COLOR]/20 ${donationType === "hypersound" ? "opacity-50 cursor-not-allowed" : ""}`}
                  required
                  min="1"
                />
              </div>
              {pricing.ttsEnabled && (
                <p className="text-xs text-muted-foreground">
                  TTS above {currencySymbol}{pricing.minTts}
                </p>
              )}
            </div>

            {donationType === "text" && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-[TW_COLOR]">
                  Your Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  maxLength={maxMessageLength}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-[TW_COLOR]/30 focus:border-[TW_COLOR] focus:ring-2 focus:ring-[TW_COLOR]/20 bg-background text-foreground placeholder:text-muted-foreground"
                  rows={3}
                />
                <p className="text-xs text-right text-muted-foreground">
                  {formData.message.length}/{maxMessageLength}
                </p>
              </div>
            )}

            {donationType === "voice" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[TW_COLOR]">Voice Message *</label>
                <EnhancedVoiceRecorder
                  controller={voiceRecorder}
                  onRecordingComplete={(hasRecording, duration) => {
                    console.log("Recording complete:", hasRecording, duration);
                  }}
                  maxDurationSeconds={getVoiceDuration(currentAmount)}
                  brandColor="[COLOR]"
                  requiredAmount={pricing.minVoice}
                  currentAmount={currentAmount}
                />
              </div>
            )}

            {donationType === "hypersound" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[TW_COLOR]">Select a Sound</Label>
                <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
              </div>
            )}

            {donationType === "media" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[TW_COLOR]">Upload Media</Label>
                <MediaUploader
                  streamerSlug="[SLUG]"
                  onMediaUploaded={(url, type) => {
                    setMediaUrl(url);
                    setMediaType(type);
                  }}
                  onMediaRemoved={() => {
                    setMediaUrl(null);
                    setMediaType(null);
                  }}
                  maxFileSizeMB={10}
                  maxVideoDurationSeconds={15}
                />
              </div>
            )}

            <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency} />

            <Button
              type="submit"
              className="w-full font-semibold py-6"
              style={{ backgroundColor: "[COLOR]" }}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? "Processing..." : `Support with ${currencySymbol}${formData.amount || "0"}`}
            </Button>
          </form>
          <DonationPageFooter brandColor="[COLOR]" />
        </CardContent>
      </Card>
    </div>
  );
};

export default [PASCAL];
```

> **Note on Tailwind color classes:** The template uses `[TW_COLOR]` (e.g., `amber-500`) in Tailwind utility classes like `border-[TW_COLOR]/30`, `text-[TW_COLOR]`, `bg-[TW_COLOR]/10`. Replace all occurrences with your streamer's Tailwind color. If using a custom hex that doesn't map to a Tailwind palette, use arbitrary values: `border-[#ff6b35]/30`, `text-[#ff6b35]`, etc.

---

### 10B: Dashboard — `src/pages/dashboard/[PASCAL]Dashboard.tsx`

```tsx
import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.[SLUG];

const [PASCAL]Dashboard = () => (
  <StreamerDashboardWrapper
    streamerSlug={config.slug}
    streamerName={config.name}
    tableName={config.tableName}
    brandColor={config.brandColor}
  />
);

export default [PASCAL]Dashboard;
```

### 10C: OBS Alerts — `src/pages/obs-alerts/[PASCAL]ObsAlerts.tsx`

```tsx
import { ObsAlertsWrapper } from '@/components/obs/ObsAlertsWrapper';

const [PASCAL]ObsAlerts = () => <ObsAlertsWrapper streamerSlug="[SLUG]" storagePrefix="[SLUG]" />;
export default [PASCAL]ObsAlerts;
```

> **`storagePrefix` convention:** Use the slug as-is (snake_case). The only exception in the codebase is `chiaa-gaming` (kebab-case, legacy). All newer streamers use their slug directly: `ankit`, `demigod`, `wolfy`, `dorp_plays`, `mr_champion`, `w_era`, `brigzard`, `zishu`, `clumsy_god`, `looteriya_gaming`.

### 10D: Goal Overlay — `src/pages/obs-alerts/[PASCAL]GoalOverlay.tsx`

```tsx
import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const [PASCAL]GoalOverlay = () => (
  <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
    <GoalOverlayWrapper streamerSlug="[SLUG]" />
  </div>
);

export default [PASCAL]GoalOverlay;
```

### 10E: Media Audio Player — `src/pages/audio-player/[PASCAL]MediaSourcePlayer.tsx`

```tsx
import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const [PASCAL]MediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="[SLUG]"
    streamerName="[NAME]"
    tableName="[SLUG]_donations"
    browserSourcePath="/[SLUG]/media-audio-player"
    brandColor="[COLOR]"
  />
);

export default [PASCAL]MediaSourcePlayer;
```

---

## STEP 11: Routes — `src/App.tsx`

Add imports:

```tsx
import [PASCAL] from "./pages/[PASCAL]";
import [PASCAL]Dashboard from "./pages/dashboard/[PASCAL]Dashboard";
import [PASCAL]ObsAlerts from "./pages/obs-alerts/[PASCAL]ObsAlerts";
import [PASCAL]GoalOverlay from "./pages/obs-alerts/[PASCAL]GoalOverlay";
import [PASCAL]MediaSourcePlayer from "./pages/audio-player/[PASCAL]MediaSourcePlayer";
```

Add routes (inside `<Routes>`):

```tsx
<Route path="/[SLUG]" element={<[PASCAL] />} />
<Route path="/dashboard/[SLUG]" element={<[PASCAL]Dashboard />} />
<Route path="/[SLUG]/obs-alerts" element={<[PASCAL]ObsAlerts />} />
<Route path="/[SLUG]/goal-overlay" element={<[PASCAL]GoalOverlay />} />
<Route path="/[SLUG]/media-audio-player" element={<[PASCAL]MediaSourcePlayer />} />
```

---

## STEP 12: Status Page — `src/pages/Status.tsx`

### 12A: `getCheckPaymentFunction` (~line 95)

```typescript
if (orderId.startsWith('[PREFIX]')) return 'check-payment-status-unified';
```

### 12B: `getBackLink` (~line 227)

```typescript
if (orderId.startsWith('[PREFIX]')) return "/[SLUG]";
```

---

## STEP 13: Assets

The donation page template imports 3 asset files directly. Place them in `src/assets/`:

- `[LOGO_FILE]` — Streamer logo (PNG/JPG, used in the circular avatar)
- `[CARD_BG_FILE]` — Card background image (JPG recommended)
- `[MAIN_BG_FILE]` — Full-page background image/banner (JPG recommended)

> **These are ES6 imports** (not public/ references), so they must go in `src/assets/`. Update the import paths at the top of your donation page if your filenames differ from the placeholders.

---

## STEP 14: Link Streamer Account (after signup)

After the streamer creates their account at `/auth`:

```sql
-- Get the auth_users UUID from the DB after they sign up
UPDATE public.streamers
SET user_id = '<their-auth_users-uuid>'
WHERE streamer_slug = '[SLUG]';

UPDATE public.auth_users
SET streamer_id = (SELECT id FROM streamers WHERE streamer_slug = '[SLUG]')
WHERE id = '<their-auth_users-uuid>';
```

---

## Edge Functions That Do NOT Need Changes

These are fully dynamic and require no manual updates:

| Function | Why |
|---|---|
| `generate-donation-tts` | Receives table name from caller |
| `notify-new-donations` | Queries `streamers` table by `streamer_id` |
| `upload-donation-media` | Uses `streamer_slug` from request |
| `upload-voice-message-direct` | Uses `streamer_slug` from request |
| `discord-webhook` | Callback-based, fully dynamic |
| `telegram-webhook` | Callback-based, fully dynamic |
| `get-streamer-pricing` | Reads from `streamers` table dynamically |
| `transcribe-voice-sarvam` | Generic, no streamer-specific config |
| `setup-discord-webhook` | Uses `streamer_id` from request |
| `setup-telegram-webhook` | Uses `streamer_id` from request |

---

## Edge Function Deployment

- **In Lovable:** Edge functions auto-deploy when files are saved. No manual step needed.
- **Outside Lovable:** Run `supabase functions deploy <function-name>` for each modified function (Steps 3-7).

---

## Quick Checklist

- [ ] SQL: Create `[SLUG]_donations` table + RLS + view (includes `amount_inr` column)
- [ ] SQL: INSERT into `streamers`
- [ ] Edge: `create-razorpay-order-unified` → `STREAMER_CONFIG`
- [ ] Edge: `check-payment-status-unified` → `STREAMER_CONFIG`
- [ ] Edge: `get-current-audio` → `STREAMER_TABLE_MAP` + `STREAMER_CHANNEL_MAP`
- [ ] Edge: `razorpay-webhook` → `DONATION_TABLE_ID_MAP` + `TABLE_TO_SLUG`
- [ ] Edge: `moderate-donation` → `ALLOWED_DONATION_TABLES`
- [ ] Frontend: `src/config/streamers.ts` → `STREAMER_CONFIGS` + `DONATION_TABLE_ID_MAP`
- [ ] Frontend: `src/config/donationPageConfigs.ts` → optional registry entry
- [ ] Pages: Donation (use full template from Step 10A), Dashboard, OBS Alerts, Goal Overlay, Audio Player
- [ ] Routes: 5 entries in `src/App.tsx`
- [ ] Status: Prefix mapping in `Status.tsx` (2 functions)
- [ ] Assets: 3 files in `src/assets/` — logo, card background, main background
- [ ] Assets: Logo + background in `public/assets/streamers/` (optional, not referenced by default template)
- [ ] Post-signup: Link `user_id` in `streamers` + `auth_users`
- [ ] Verify: Edge functions deployed (auto in Lovable, manual outside)
