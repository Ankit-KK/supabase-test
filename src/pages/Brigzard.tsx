import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import MediaUploader from "@/components/MediaUploader";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
import DonationPageFooter from "@/components/DonationPageFooter";
import RewardsBanner from "@/components/RewardsBanner";

// ─── BASE64 ASSETS ───────────────────────────────────────────────────────────
const MW_FONT_B64 = "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";

const LOGO_B64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH7Q==";

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
  @font-face {
    font-family: 'ModernWarfare';
    src: url('data:font/truetype;base64,${`AAEAAAAOAIAAAwBgT1MvMkN2ZMYAAADsAAAAZGNtYXCPP8dKAAABUAAAAlJjdnQgGGENkAAAKbAAAAA0ZnBnbWIu+3sAACnkAAAODGdhc3AAAAAQAAApqAAAAAhnbHlmmW2N3wAAA6QAABsYaGVhZBzGaBEAAB68AAAANmhoZWEReQk4AAAe9AAAACRobXR4awMdRgAAHxgAAAOsbG9jYZ3gpgQAACLEAAAB2G1heHAB6Q53AAAknAAAACBuYW1lMfVMSwAAJLwAAAJccG9zdDpt5/wAACcYAAACj3ByZXBoRsicAAA38AAAAKcABQUGAZAABQAABZoFMwAAATMFmgUzAAADmgBmAhIAAAIABgAAAAAAAAAAAAADAAAAAAAAAAAAAAAASEwgIAFAACD7AgYr/l0AzQd5AaMAAAABAAAAAAO+BZoAAAAgAAAAAP//AAAAAwAAAAMAAAAcAAEAAAAAAUwAAwABAAAAHAAEATAAAABGAEAABQAGAH4AoACsAK0A/wExAwQDCAMKAwwDJyAUIBogHiAiICYgOiBEIKQgpyCsIRYhIiICIgYiDyISIhUiGiIeIisiSCJl+wL//wAAACAAoAChAK0ArgExAwADBwMKAwwDJyATIBggHCAgICYgOSBEIKMgpyCsIRYhIiICIgYiDyIRIhUiGSIeIisiSCJk+wH////hAAD/vwAA/77/jf2//b39vP27/aHgtuCz4LLgseCu4Jzgk+A14DPgL9/G37ve3N7Z3tHe0N7CAADext663p7egwXoAAEAAABEAAAAQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAAAAAAAAAAAAAAAEADgB1AOMAAAEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fAIKDhYePlJqfnqCioaOlp6aoqauqrK2vsbCytLO4t7m60W5hYmbTdJ1saN1yZwCEluRv5+hkc97h4ADlaXgApLZ9YGvjAObfannUAX6BkwAAycrOz8vMtQC9ANdj1dbp6tJ1zdAAgIh/iYaLjI2KkZIAkJiZl74AAG0AAAB2AAAAAAAABABkAAADnAWaAAMABwAkADgAS0BIJAgCBQY3AQIFAkwABQYCBgUCgAAAAAMEAANnAAQABgUEBmkAAgEBAlcAAgIBXwcBAQIBTwAAIR8YFw0LBwYFBAADAAMRCAYXKzMRIRElIREhFzY3NjMyFhUUBgcOARUUFyMmNTQSNTQmIyIHBgcTNzYzMh8BFhUUDwEGIyIvASY1NGQDOPz6AtT9LK8fGzU7XHAuQD9IGCAjo0I6Jh8aHkA5CwkKDDgJCjgOBwsJPQcFmvpmMgU27BwPHl9QMWNQUGgvJl9hM0wBHEs5QhEPGfz/OgoLPAsJCws+DgpHCQkKAAACAEYAAAhaBVYABwAKACVAIgoBBAEBTAAEAAMABANoAAEBEE0CAQAADwBOERERERAFBxsrKQEBIQEhJyETIQECFP4yAvkCMgLp/jWB/I6RAkr+2wVW+qr4ARoCHQAAAAADALIAAAeeBVYAEAAZACIAOkA3CAEEAwFMAAMABAUDBGcAAgIAXwYBAAAQTQAFBQFfAAEBDwFOAQAhHx4cGBYVEw8NABABEAcHFisBMhYVFA4CBx4BFRQGIyERATQmIyEVITI2EzQmIyEVITI2BcPM2R5QRD2mf9vs+tsFE1BO/SsCzVJUN0ho/QYC9EdvBVacxFZ5RhgRGnOi46YFVv5iRi3uLf5QOD36HwAAAQCa//IHbQViACUAXkuwDVBYQCMAAgMFAwIFgAAFBAQFcAADAwFfAAEBDk0ABAQAYAAAAA8AThtAJAACAwUDAgWAAAUEAwUEfgADAwFfAAEBDk0ABAQAYAAAAA8ATllACRJEUhNFQgYHHCsBEAYhBSUgJjUDEBIhJTIWBBYVITQmIycjByIGFRQWMxc3MjY1IQdtz/7P/sL+/v5k6wzEAS8BhareATuH/m1cZXVy071UY9Wi1XxrAZcBzf7lugYE1+MBHwFQATkKBiHz014/AgKL2+GHBQNFgQAAAAIAsgAAB9cFVgANABcAKEAlAAICAF8EAQAAEE0AAwMBXwABAQ8BTgEAFhQTEQwKAA0BDQUHFisBIBYRHQIUDgIjIREBNTQmIyERITI2BWYBc/4GKfK2+rIFgVrF/T4CvMFkBVb2/pBOKyVgTvC0BVb9UAzJi/1IjwAAAAABALIAAAamBVYACwAvQCwAAQACAwECZwAAAAVfBgEFBRBNAAMDBF8ABAQPBE4AAAALAAsREREREQcHGysBESEVIQMhFSERIREGpvusBAp8/HIEVPoMBVb+yer+8vL+ywVWAAAAAQCyAAAGXAVWAAkAKUAmAAEAAgMBAmcAAAAEXwUBBAQQTQADAw8DTgAAAAkACREREREGBxorAREhFSERIREhEQZc+/YECvv2/mAFVv7J6v7y/dkFVgAAAAEAmP/yB48FZAAtAGhLsBBQWEAlAAIDBgMCcgcBBgAFBAYFZwADAwFfAAEBDk0ABAQAXwAAAA8AThtAJgACAwYDAgaABwEGAAUEBgVnAAMDAV8AAQEOTQAEBABfAAAADwBOWUAPAAAALQAtE0Y0E1ZTCAccKwETFAYjBy8BIiQmNScQEiElNwUgFhEVITQuAiMlIgYdARQeAjMFMjY1JyERB40CrvzZ+Nfr/uuhBMQBbQE3cwEWAQ/z/mkdTkdE/h+UTk6QTTwBcml5Av3xAwL+4fzzAgICP9ngrAGPATMGAga6/vYZMUYcBwKQqn+NiRMEAkZgJwEAAAAAAAEAsAAAB6AFVgALACdAJAAEAAEABAFnBgUCAwMQTQIBAAAPAE4AAAALAAsREREREQcHGysBESERIREhESERIREHoP5e/FL+YAGgA64FVvqqAg798gVW/gwB9AAAAQCyAAACUgVWAAMAGUAWAAAAEE0CAQEBDwFOAAAAAwADEQMHFyszESERsgGgBVb6qgAAAAEARP/0BcMFVgAWACJAHwABAwIDAQKAAAMDEE0AAgIAYQAAABkAThQzFDMEBxorARQCBAYjICQmNTchBxQWOwEyNjU3ESEFw3n+19lj/vL+/I8CAY8CgXtuZX8CAaACLfr/ADcIM9/+RFptPzNQaAMpAAAAAQCyAAAH7gVWAAwALUAqAwECBQFMBgEFAAIBBQJnBAEAABBNAwEBAQ8BTgAAAAwADBERERIRBwcbKwkBIQkBIQEjESERIREDJwIzAj788QNl/Z39nNX+YAGgA1QCAv1c/U4CCP34BVb9/gAAAQCyAAAGAgVWAAUAH0AcAAEBEE0DAQICAGAAAAAPAE4AAAAFAAUREQQHGCsBESERIREGAvqwAaABVv6qBVb8AAAAAAABALAAAAm8BVYACwAmQCMIAwIBBAABAUwCAQEBEE0EAwIAAA8ATgAAAAsACxIRFAUHGSshEQkBESERIQkBIREIM/0C/QL+eQJGAkUCaAIZA6L8aAOY/F4FVv01Asv6qgABALAAAAgEBVYACQAkQCEGAQIAAQFMAgEBARBNBAMCAAAPAE4AAAAJAAkSERIFBxkrIQERIREhAREhEQVv/Mj+eQKWAzcBhwQC+/4FVvwABAD6qgACAJj/8gfnBWQAEgAnAC1AKgADAwBfBAEAAA5NBQECAgFfAAEBDwFOFhMCACAdEycWJwwHABICEQYHFisBBSAEERUQAiEFByUiJDUnEBIhExc3MjY1NzQuAiMFIg4BHQIUFgQjAUwBbAEM1f5Q/seD/uXt/v4E1QGPRt/VsJkFF0aJTv5jjpMXWAVkAvH+lUH+Vv7fBgIK1/D7AaABAPvoBAJLlrhehj8UAjm6PiU3vIMAAAACALIAAAcpBVYACwAUAC1AKgAEAAECBAFnAAMDAF8FAQAAEE0AAgIPAk4BABMREA4KCQgFAAsBCwYHFisBIBYREAYhIyERIREBNCYjIREhMjYFBAE18Lr+12v9d/5gBNNie/2qAlx3YAVWyf7R/uHr/qwFVv36c0f+lkMAAgCY//IIgwViAB4ANAAxQC40MzIxHBYGAwIeHQIAAwJMAAICAV8AAQEOTQADAwBfAAAADwBOMC0nI0lCBAcYKyUOASMFISIuAjUnND4BJCElMhYEFhUeARUUBgcXAwE0LgIjJyIOAh0BFBYzJTI3JRMBB1Bg4on+y/66vPqRJwQIJQESAUABOabfATnNBgQGDLCR/lAFGn9c9nWTzUJl1wHLO0H+RqwBkmpBMQYvpNODqlqi6bQEBh/IyTWmCnuDWmH+7gLjNU55NQQEFoN/b8t/CRD0ARD+/gAAAAIAsgAAB3MFVgAVACIAO0A4CAECBAFMBwEEAAIBBAJnAAUFAF8GAQAAEE0DAQEBDwFOFxYBACAdFiIXIRQTEhANDAAVARUIBxYrATIWFRQOAgceARURITU0JiMhESERATI2NTQuAisBIREhBar20xU9UoOPh/5aIpL9Sv5gBEqNRhtUNSUh/W0CdQVWvvJcg2EvKxJth/76g2R3/qIFVv1URnhEQhgE/qAAAAABAJb/9AdIBWQANwCttQABAAcBTEuwElBYQCsAAwQFBANyAAcBAAAHcgAFAAEHBQFnAAQEAl8AAgIOTQAAAAZgAAYGDwZOG0uwFVBYQCwAAwQFBANyAAcBAAEHAIAABQABBwUBZwAEBAJfAAICDk0AAAAGYAAGBg8GThtALQADBAUEAwWAAAcBAAEHAIAABQABBwUBZwAEBAJfAAICDk0AAAAGYAAGBg8GTllZQAsTRFRCFEVEQggHHisBFBYzFyUyNjU0JisBJSImNTQ2LAEzBTIeAhUhNCYjJwUiBhUUFjsBDQEgFhUUBiMFJSImPQEhAjtxZMUBF3JGUHFD/VTBnWQBCAGsSgEjrtVYGP5pVEzJ/sNAWGlaKwEWARMBCPDX+P3r/urd0QGZAZ5UKwIIOT43QQ/Cyaq8RAwEN5N3aUg5AgovN0wvBAKm+vK0DgaP2VIAAQA1AAAGmAVWAAcAIUAeAgEAAAFfAAEBEE0EAQMDDwNOAAAABwAHERERBQcZKyERIREhESERApj9nQZj/Z8EAAFW/qr8AAAAAQCw//AHiwVUABcAG0AYAwEBARBNAAICAGAAAAAPAE4UQxQzBAcaKwEVEAQhJSAkJjURIREUFjMXNzI2PQERIQeL/rL+pP6s/vL+4bABoGLHuqyqYAGiAkpQ/sDKAjnp+gNG/TXNegMDaqIzAtMAAAEANQAACBIFVgAGACFAHgMBAgABTAEBAAAQTQMBAgIPAk4AAAAGAAYSEQQHGCshASEJASEBAwb9LwHHAhgCMAHO/QcFVvv6BAb6qgABALAAAAm8BVYACwAmQCMIAwIBBAEAAUwEAwIAABBNAgEBAQ8BTgAAAAsACxIRFAUHGSsBEQkBESERIQkBIRECOQL/Av0Bh/27/br9mf3mBVb8XgOY/GgDovqqAsv9NQVWAAAAAQA1AAAIOwVWAAsAIEAdCwgFAgQAAgFMAwECAhBNAQEAAA8AThISEhAEBxorKQEJASEJASEJASEBCDv9x/41/jP9ywKq/X0CKwG0AbcCGP2BAen+FwKqAqz+FwHp/VQAAQApAAAH1wVWAAgAI0AgBwQBAwABAUwDAgIBARBNAAAADwBOAAAACAAIEhIEBxgrCQERIREBIQkBB9f9AP5e/PQCDAHPAcsFVvyF/iUB2wN7/c0CMwAAAAEAdQAABvIFVgAJAC1AKggBAQMBAwJLAAEBAl8AAgIQTQQBAwMAXwAAAA8ATgAAAAkACRESEQUHGSsBESERASERIREBBvL5gwQG/BQGTvvyATX+ywE1AuoBN/7J/RYAAAIARgAACFoFVgAHAAoAJUAiCgEEAQFMAAQAAwAEA2gAAQEQTQIBAAAPAE4REREREAUHGyspAQEhASEnIRMhAQIU/jIC+QIyAun+NYH8jpECSv7bBVb6qvgBGgIdAAAAAAMAsgAAB54FVgAQABkAIgA6QDcIAQQDAUwAAwAEBQMEZwACAgBfBgEAABBNAAUFAV8AAQEPAU4BACEfHhwYFhUTDw0AEAEQBwcWKwEyFhUUDgIHHgEVFAYjIREBNCYjIRUhMjYTNCYjIRUhMjYFw8zZHlBEPaZ/2+z62wUTUE79KwLNUlQ3SGj9BgL0R28FVpzEVnlGGBEac6LjpgVW/mJGLe4t/lA4PfofAAABAJr/8gdtBWIAJQBeS7ANUFhAIwACAwUDAgWAAAUEBAVwAAMDAV8AAQEOTQAEBABgAAAADwBOG0AkAAIDBQMCBYAABQQDBQR+AAMDAV8AAQEOTQAEBABgAAAADwBOWUAJEkRSE0VCBgccKwEQBiEFJSAmNQMQEiElMhYEFhUhNCYjJyMHIgYVFBYzFzcyNjUhB23P/s/+wv7+/mTrDMQBLwGFqt4BO4f+bVxldXLTvVRj1aLVfGsBlwHN/uW6BgTX4wEfAVABOQoGIfPTXj8CAovb4YcFA0WBAAAAAgCyAAAH1wVWAA0AFwAoQCUAAgIAXwQBAAAQTQADAwFfAAEBDwFOAQAWFBMRDAoADQENBQcWKwEgFhEdAhQOAiMhEQE1NCYjIREhMjYFZgFz/gYp8rb6sgWBWsX9PgK8wWQFVvb+kE4rJWBO8LQFVv1QDMmL/UiPAAAAAAEAsgAABqYFVgALAC9ALAABAAIDAQJnAAAABV8GAQUFEE0AAwMEXwAEBA8ETgAAAAsACxERERERBwcbKwERIRUhESEVIREhEQam+6wECvv2BFT6DAVW/snq/vLy/ssFVgAAAAABALIAAAZcBVYACQApQCYAAQACAwECZwAAAARfBQEEBBBNAAMDDwNOAAAACQAJEREREQYHGisBESEVIQMhESERBlz79gQKfPxy/mAFVv7J6v7y/dkFVgAAAQCY//IHjwVkAC0AaEuwEFBYQCUAAgMGAwJyBwEGAAUEBgVnAAMDAV8AAQEOTQAEBABfAAAADwBOG0AmAAIDBgMCBoAHAQYABQQGBWcAAwMBXwABAQ5NAAQEAF8AAAAPAE5ZQA8AAAAtAC0TRjQTVlMIBxwrARMUBiMHLwEiJCY1JxASISU3BSAWERUhNC4CIyUiBh0BFB4CMwUyNjUnIREHjQKu/Nn41+v+66EExAFtATdzARYBD/P+aR1OR0T+H5ROTpBNPAFyaXkC/fEDAv7h/PMCAgI/2eCsAY8BMwYCBrr+9hkxRhwHApCqf42JEwQCRmAnAQAAAAAAAQCwAAAHoAVWAAsAJ0AkAAQAAQAEAWcGBQIDAxBNAgEAAA8ATgAAAAsACxERERERBwcbKwERIREhESERIREhEQeg/l78Uv5gAaADrgVW+qoCDv3yBVb+DAH0AAABALIAAAJSBVYAAwAZQBYAAAAQTQIBAQEPAU4AAAADAAMRAwcXKzMRIRGyAaAFVvqqAAAAAQBE//QFwwVWABYAIkAfAAEDAgMBAoAAAwMQTQACAgBhAAAAGQBOFDMUMwQHGisBFAIEBiMgJCY1NyEHFBY7ATI2NTcRIQXDef7X2WP+8v78jwIBjwKBe25lfwIBoAIt+v8ANwgz3/5EWm0/M1BoAykAAAABALIAAAfuBVYADAAtQCoDAQIFAUwGAQUAAgEFAmcEAQAAEE0DAQEBDwFOAAAADAAMEREREhEHBxsrCQEhCQEhASMRIREhEQMnAjMCPvzxA2X9nf2c1f5gAaADVAIC/Vz9TgII/fgFVv3+AAABALIAAAYCBVYABQAfQBwAAQEQTQMBAgIAYAAAAA8ATgAAAAUABRERBAcYKwERIREhEQYC+rABoAFW/qoFVvwAAAAAAAEAsAAACbwFVgALACZAIwgDAgEEAAEBTAIBAQEQTQQDAgAADwBOAAAACwALEhEUBQcZKyERCQERIREhCQEhEQgz/QL9Av55AhQCdwJoAhkDovxoA5j8XgVW/TUCy/qqAAEAsAAACAQFVgAJACRAIQYBAgABAUwCAQEBEE0EAwIAAA8ATgAAAAkACRIREgUHGSshAREhESEBESERBW/8yP55ApYDNwGHBAL7/gVW/AAEAPqqAAIAmP/yB+cFZAASACcALUAqAAMDAF8EAQAADk0FAQICAV8AAQEPAU4WEwIAIB0TJxYnDAcAEgIRBgcWKwEFIAQRFRACIQUHJSIkNScQEiETFzcyNjU3NC4CIwUiDgEdAhQWBCMBTAFsAQzV/lD+x4P+5e3+/gTVAY9G39WwmQUXRolO/mOOkxdYBWQC8f6VQf5W/t8GAgrX8PsBoAEA++gEAkuWuF6GPxQCObo+JTe8gwAAAAIAsgAABykFVgALABQALUAqAAQAAQIEAWcAAwMAXwUBAAAQTQACAg8CTgEAExEQDgoJCAUACwELBgcWKwEgFhEQBiEjIREhEQE0JiMhESEyNgUEATXwuv7Xa/13/mAE02J7/aoCXHdgBVbJ/tH+4ev+rAVW/fpzR/6WQwACAJj/8giDBWIAHgA0ADFALjQzMjEcFgYDAh4dAgADAkwAAgIBXwABAQ5NAAMDAF8AAAAPAE4wLScjSUIEBxgrJQ4BIwUhIi4CNSc0PgEkISUyFgQWFR4BFRQGBxcDATQuAiMnIg4CHQEUFjMlMjclEwEHUGDiif7L/rq8+pEnBAglARIBQAE5pt8BOc0GBAYMsJH+UAUaf1z2dZPNQmXXAcs7Qf5GrAGSakExBi+k04OqWqLptAQGH8jJNaYKe4NaYf7uAuM1Tnk1BAQWg39vy38JEPQBEP7+AAAAAgCyAAAHcwVWABUAIgA7QDgIAQIEAUwHAQQAAgEEAmcABQUAXwYBAAAQTQMBAQEPAU4XFgEAIB0WIhchFBMSEA0MABUBFQgHFisBMhYVFA4CBx4BFREhNTQmIyERIREBMjY1NC4CKwEhESEFqvbTFT1Sg4+H/loikv1K/mAESo1GG1Q1JSH9bQJ1BVa+8lyDYS8rEm2H/vqDZHf+ogVW/VRGeERCGAT+oAAAAAEAlv/0B0gFZAA3AK21AAEABwFMS7ASUFhAKwADBAUEA3IABwEAAAdyAAUAAQcFAWcABAQCXwACAg5NAAAABmAABgYPBk4bS7AVUFhALAADBAUEA3IABwEAAQcAgAAFAAEHBQFnAAQEAl8AAgIOTQAAAAZgAAYGDwZOG0AtAAMEBQQDBYAABwEAAQcAgAAFAAEHBQFnAAQEAl8AAgIOTQAAAAZgAAYGDwZOWVlACxNEVEIURURCCAceKwEUFjMXJTI2NTQmKwElIiY1NDYsATMFMh4CFSE0JiMnBSIGFRQWOwENASAWFRQGIwUlIiY9ASECO3FkxQEXckZQcUP9VMGdZAEIAaxKASOu1VgY/mlUTMn+w0BYaVorARYBEwEI8Nf4/ev+6t3RAZkBnlQrAgg5PjdBD8LJqrxEDAQ3k3dpSDkCCi83TC8EAqb68rQOBo/ZUgABADUAAAaYBVYABwAhQB4CAQAAAV8AAQEQTQQBAwMPA04AAAAHAAcREREFBxkrIREhESERIRECmP2dBmP9nwQAAVb+qvwAAAABALD/8AeLBVQAFwAbQBgDAQEBEE0AAgIAYAAAAA8AThRDFDMEBxorARUQBCElICQmNREhERQWMxc3MjY9AREhB4v+sv6k/qz+8v7hsAGgYse6rKpgAaICSlD+wMoCOen6A0b9Nc16AwNqojMC0wAAAQA1AAAIEgVWAAYAIUAeAwECAAFMAQEAABBNAwECAg8CTgAAAAYABhIRBAcYKyEBIQkBIQEDBv0vAccCGAIwAc79BwVW+/oEBvqqAAEAsAAACbwFVgALACZAIwgDAgEEAQABTAQDAgAAEE0CAQEBDwFOAAAACwALEhEUBQcZKwERCQERIREhCQEhEQI5Av8C/QGH/bv9uv2Z/eYFVvxeA5j8aAOi+qoCy/01BVYAAAABADUAAAg7BVYACwAgQB0LCAUCBAACAUwDAQICEE0BAQAADwBOEhISEAQHGispAQkBIQkBIQkBIQEIO/3H/jX+M/3LAqr9fQIrAbQBtwIY/YEB6f4XAqoCrP4XAen9VAABACkAAAfXBVYACAAjQCAHBAEDAAEBTAMCAgEBEE0AAAAPAE4AAAAIAAgSEgQHGCsJAREhEQEhCQEH1/0A/l789AIMAc8BywVW/IX+JQHbA3v9zQIzAAAAAQB1AAAG8gVWAAkALUAqCAEBAwEDAksAAQECXwACAhBNBAEDAwBfAAAADwBOAAAACQAJERIRBQcZKwERIREBIREhEQEG8vmDBAb8FAZO+/IBNf7LATUC6gE3/sn9FgAAAQAAAAEAABsED+JfDzz1AA0IAAAAAADZ4I2qAAAAANngj+IAKf/wCbwFmgAAAAYAAQAAAAAAAAABAAAHef5dABgKbwAp/4AJvAABAAAAAAAAAAAAAAAAAAAA6wQAAGQB/AAAAqAAAAKgAAAFOAAAA/YAAAZKAAAGkwAAAVoAAAL2AAAC9gAABAAAAAP2AAACLQAAAp4AAAItAAACOQAAA/YAAAP2AAAD9gAAA/YAAAP2AAAD9gAAA/YAAAP2AAAD9gAAA/YAAAItAAACLQAAA/YAAAP2AAAD9gAAAuwAAAfjAAAIngBGCDMAsgf+AJoIbQCyBycAsgamALIIIwCYCFIAsAMEALIGdQBECCMAsgY3ALIKbwCwCLYAsAh9AJgHnACyCIMAmAgXALIH3QCWBs8ANQg9ALAISgA1Cm8AsAhzADUIAAApB2YAdQL2AAACOQAAAvYAAAP2AAAEAAAABAAAAAieAEYIMwCyB/4AmghtALIHJwCyBdwAsggjAJgIUgCwAwQAsgZ1AEQIIwCyBjcAsgpvALAItgCwCH0AmAecALIIgwCYCBcAsgfdAJYGzwA1CD0AsAhKADUKbwCwCHMANQgAACkHZgB1A/YAAAP2AAAD9gAAA/YAAAKgAAAEcwAAA/YAAAP2AAAD9gAAA/YAAAP2AAAEAAAABooAAAKIAAADsAAAA/YAAAaKAAAEAAAAAqIAAAP2AAAD9gAAA/YAAAQAAAAEnAAABAAAAAH8AAAEAAAAA/YAAAXyAAADsAAABqwAAAlCAAAGrAAAAuwAAAYEAAAGBAAABgQAAAYEAAAGBAAABgQAAAgqAAAFdwAABH8AAAR/AAAEfwAABH8AAAKRAAACkQAAApEAAAKRAAAF7gAABhIAAAZOAAAGTgAABk4AAAZOAAAGTgAAA/YAAAZOAAAF3QAABd0AAAXdAAAF3QAABNEAAARgAAAE4wAAA5oAAAOaAAADmgAAA5oAAAOaAAADmgAABasAAAOJAAADjQAAA40AAAONAAADjQAAAgIAAAICAAACAgAAAgIAAARzAAAEVAAAA/IAAAPyAAAD8gAAA/IAAAPyAAAD9gAAA/IAAAQjAAAEIwAABCMAAAQjAAADZAAAA/IAAANkAAACAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARUAAAIAAAAAi0AAAItAAACLQAAA44AAAOOAAADjgAAA/YAAAP2AAAEAAAACAAAAAJ3AAACdwAAAVYAAAP2AAAD9gAAB+wAAAP2AAAI3wAABdkAAAP2AAAEOQAABesAAAS2AAAD9gAAA/YAAAP2AAACmQAAA/YAAAP2AAAD9gAABDEAAAQ5AAAAAAB8AHwAfAB8AHwAfAB8AHwAfAB8AHwAfAB8AHwAfAB8AHwAfAB8AHwAfAB8AHwAfAB8AHwAfAB8AHwAfAB8AHwAfAB8AKwBAgFwAa4B4AIMAooCuALSAwwDQgNkA5QDvgQYBFYExAUaBcQF6AYgBkYGeAaoBtQHBAcEBwQHBAcEBwQHBAc0B4oH+Ag2CGgIlAkSCUAJWgmUCcoJ7AocCkYKoAreC0wLogxMDHAMqAzODQANMA1cDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MDYwNjA2MAAEAAADrADkABAAAAAAAAgAQADAAjQAAAFwODAAAAAAAAAAIAGYAAwABBAkAAABoAAAAAwABBAkAAQAcAGgAAwABBAkAAgAOAIQAAwABBAkAAwA2AJIAAwABBAkABAAcAMgAAwABBAkABQB4AOQAAwABBAkABgAaAVwAAwABBAkACgCAAXYAVAB5AHAAZQBmAGEAYwBlACAAqQAgACgAeQBvAHUAcgAgAGMAbwBtAHAAYQBuAHkAKQAuACAAMgAwADEAOQAuACAAQQBsAGwAIABSAGkAZwBoAHQAcwAgAFIAZQBzAGUAcgB2AGUAZABNAG8AZABlAHIAbgAgAFcAYQByAGYAYQByAGUAUgBlAGcAdQBsAGEAcgBNAG8AZABlAHIAbgAgAFcAYQByAGYAYQByAGUAOgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMABNAG8AZABlAHIAbgAgAFcAYQByAGYAYQByAGUAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAOwBPAGMAdABvAGIAZQByACAAMwAxACwAIAAyADAAMQA5ADsARgBvAG4AdABDAHIAZQBhAHQAbwByACAAMQAyAC4AMAAuADAALgAyADUAMgAyACAAMwAyAC0AYgBpAHQATQBvAGQAZQByAG4AVwBhAHIAZgBhAHIAZQBUAGgAaQBzACAAZgBvAG4AdAAg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`}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  :root {
    --mw-black:     #000000;
    --mw-white:     #ffffff;
    --mw-grey-100:  #f0f0f0;
    --mw-grey-200:  #d0d0d0;
    --mw-grey-300:  #a0a0a0;
    --mw-grey-400:  #707070;
    --mw-grey-500:  #505050;
    --mw-grey-600:  #303030;
    --mw-grey-700:  #202020;
    --mw-grey-800:  #141414;
    --mw-grey-900:  #0a0a0a;
    --mw-accent:    #c8c8c8;
    --mw-dim:       rgba(255,255,255,0.06);
    --mw-border:    rgba(255,255,255,0.12);
    --mw-border-hi: rgba(255,255,255,0.35);
    --mw-font:      'ModernWarfare', 'Eurostile', 'Arial Black', sans-serif;
    --mw-body:      'Arial', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  .mw-root { font-family: var(--mw-body); }

  /* ── PAGE ── */
  .mw-page {
    width: 100vw; height: 100dvh;
    background: var(--mw-black);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  /* ── NOISE OVERLAY ── */
  .mw-noise {
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 128px 128px;
  }

  /* ── SCAN LINES ── */
  .mw-scan {
    position: fixed; inset: 0; z-index: 2; pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(255,255,255,0.012) 3px,
      rgba(255,255,255,0.012) 4px
    );
  }

  /* ── VIGNETTE ── */
  .mw-vignette {
    position: fixed; inset: 0; z-index: 2; pointer-events: none;
    background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%);
  }

  /* ── GRID BG ── */
  .mw-grid {
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    animation: mw-grid-drift 12s ease-in-out infinite;
  }
  @keyframes mw-grid-drift {
    0%, 100% { opacity: 0.6; background-position: 0 0; }
    50% { opacity: 1; background-position: 4px 4px; }
  }

  .mw-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  /* ── CARD ── */
  .mw-card {
    width: 420px;
    background: var(--mw-grey-900);
    border: 1px solid var(--mw-border);
    clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
    position: relative;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .mw-card.mw-int-1 { border-color: rgba(255,255,255,0.22); box-shadow: 0 0 30px rgba(255,255,255,0.04); }
  .mw-card.mw-int-2 { border-color: rgba(255,255,255,0.38); box-shadow: 0 0 50px rgba(255,255,255,0.07); }
  .mw-card.mw-int-3 { border-color: rgba(255,255,255,0.6); box-shadow: 0 0 70px rgba(255,255,255,0.12), 0 0 120px rgba(255,255,255,0.04); }

  /* Card shimmer border */
  .mw-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 70%, transparent 100%);
    background-size: 200% 100%;
    animation: mw-shimmer 4s linear infinite;
  }
  @keyframes mw-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

  /* Screen shake */
  .mw-card.mw-shaking { animation: mw-shake 0.3s ease forwards !important; }
  @keyframes mw-shake {
    0%, 100% { transform: translate(0, 0); }
    20% { transform: translate(-4px, 2px); }
    40% { transform: translate(4px, -2px); }
    60% { transform: translate(-3px, 1px); }
    80% { transform: translate(3px, -1px); }
  }

  /* Corner brackets */
  .mw-bracket { position: absolute; width: 16px; height: 16px; z-index: 5; pointer-events: none; }
  .mw-bracket-tl { top: 4px; left: 4px; border-top: 2px solid rgba(255,255,255,0.5); border-left: 2px solid rgba(255,255,255,0.5); }
  .mw-bracket-tr { top: 4px; right: 26px; border-top: 2px solid rgba(255,255,255,0.5); border-right: 2px solid rgba(255,255,255,0.5); }
  .mw-bracket-bl { bottom: 26px; left: 4px; border-bottom: 2px solid rgba(255,255,255,0.5); border-left: 2px solid rgba(255,255,255,0.5); }
  .mw-bracket-br { bottom: 4px; right: 4px; border-bottom: 2px solid rgba(255,255,255,0.5); border-right: 2px solid rgba(255,255,255,0.5); }

  /* ── GLITCH KEYFRAMES ── */
  @keyframes mw-glitch {
    0%, 88%, 100% { transform: none; clip-path: none; opacity: 1; }
    89% { transform: translateX(-3px); clip-path: polygon(0 15%, 100% 15%, 100% 35%, 0 35%); opacity: 0.9; filter: hue-rotate(0deg) saturate(0); }
    90% { transform: translateX(3px) skewX(-3deg); clip-path: polygon(0 55%, 100% 55%, 100% 75%, 0 75%); filter: contrast(1.5); }
    91% { transform: translateX(-2px); clip-path: none; filter: none; }
    92% { transform: translateX(2px); opacity: 0.7; }
    93% { transform: none; opacity: 1; }
    95% { transform: translateX(-1px); clip-path: polygon(0 70%, 100% 70%, 100% 85%, 0 85%); }
    96% { transform: none; clip-path: none; }
  }

  @keyframes mw-glitch-subtle {
    0%, 92%, 100% { transform: none; opacity: 1; }
    93% { transform: translateX(-2px); opacity: 0.85; }
    94% { transform: translateX(2px); opacity: 0.9; }
    95% { transform: none; }
  }

  /* ── HERO ── */
  .mw-hero {
    position: relative; padding: 0;
    display: flex; flex-direction: column;
    overflow: hidden;
    border-bottom: 1px solid var(--mw-border);
  }

  /* Logo + Live row */
  .mw-hero-top {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .mw-logo {
    height: 44px; width: auto;
    filter: invert(1) brightness(0.9);
    opacity: 0.95;
  }

  .mw-live {
    display: flex; align-items: center; gap: 6px;
    border: 1px solid rgba(255,255,255,0.25);
    padding: 4px 12px;
    clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
    background: rgba(255,255,255,0.04);
  }
  .mw-live-dot {
    width: 5px; height: 5px; border-radius: 50%; background: #fff;
    animation: mw-pulse 1.2s ease-in-out infinite;
    box-shadow: 0 0 6px rgba(255,255,255,0.8);
  }
  @keyframes mw-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .mw-live-text {
    font-family: var(--mw-font); font-size: 8px; font-weight: 700;
    color: var(--mw-white); letter-spacing: 0.25em;
  }

  /* Name block */
  .mw-hero-name-block {
    padding: 14px 18px 16px;
    position: relative;
  }

  .mw-tag-line {
    font-family: var(--mw-font); font-size: 8px; letter-spacing: 0.3em;
    color: rgba(255,255,255,0.4); text-transform: uppercase;
    margin-bottom: 4px; display: block;
  }

  .mw-name {
    font-family: var(--mw-font); font-size: 36px; font-weight: 400;
    color: var(--mw-white); line-height: 1; letter-spacing: 0.1em;
    text-transform: uppercase;
    animation: mw-glitch 10s infinite;
    display: inline-block;
  }

  .mw-greeting {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 6px;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 3px 10px;
    clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
    background: rgba(255,255,255,0.06);
    animation: mw-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes mw-slide-in { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
  .mw-greeting-text {
    font-family: var(--mw-font); font-size: 9px; letter-spacing: 0.2em;
    color: var(--mw-white); text-transform: uppercase;
  }

  .mw-sub-tag {
    display: inline-block; margin-top: 6px;
    font-family: var(--mw-font); font-size: 8px; letter-spacing: 0.18em;
    color: rgba(255,255,255,0.35); text-transform: uppercase;
    border-left: 2px solid rgba(255,255,255,0.2);
    padding-left: 8px;
  }

  /* ── COMMAND BAR ── */
  .mw-cmdbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 18px;
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid var(--mw-border);
  }
  .mw-rank-badge {
    font-family: var(--mw-font); font-size: 9px; letter-spacing: 0.12em;
    color: var(--mw-black); background: var(--mw-white);
    padding: 2px 8px;
    clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
  }
  .mw-fleet-name {
    font-family: var(--mw-font); font-size: 9px; letter-spacing: 0.12em;
    color: rgba(255,255,255,0.5); text-transform: uppercase;
  }
  .mw-xp-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
  .mw-xp-label {
    font-family: var(--mw-font); font-size: 7px; letter-spacing: 0.18em;
    color: rgba(255,255,255,0.25);
  }
  .mw-xp-bar { width: 88px; height: 2px; background: rgba(255,255,255,0.1); overflow: hidden; }
  .mw-xp-fill { height: 100%; width: 74%; background: var(--mw-white); }

  /* ── BODY ── */
  .mw-body { padding: 14px 18px 16px; display: flex; flex-direction: column; gap: 12px; }

  .mw-lbl {
    font-family: var(--mw-font); font-size: 8px; font-weight: 700;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.45); display: block; margin-bottom: 6px;
  }

  /* ── INPUTS ── */
  .mw-iw { position: relative; }
  .mw-iw::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: var(--mw-white); transform: scaleX(0); transform-origin: left;
    transition: transform 0.2s ease;
  }
  .mw-iw:focus-within::after { transform: scaleX(1); }
  .mw-iw input {
    width: 100% !important;
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.18) !important;
    border-radius: 0 !important;
    color: var(--mw-white) !important;
    font-family: var(--mw-body) !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    padding: 8px 12px !important;
    outline: none !important;
    transition: all 0.2s !important;
    caret-color: var(--mw-white);
    letter-spacing: 0.04em !important;
  }
  .mw-iw input:focus {
    border-color: rgba(255,255,255,0.5) !important;
    background: rgba(255,255,255,0.07) !important;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.08) !important;
  }
  .mw-iw input::placeholder { color: rgba(255,255,255,0.2) !important; }
  .mw-iw input:disabled, .mw-iw input[readonly] { opacity: 0.3 !important; cursor: not-allowed !important; }

  .mw-ta {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 0;
    color: var(--mw-white);
    font-family: var(--mw-body);
    font-size: 13px; font-weight: 600;
    padding: 8px 12px; resize: none; outline: none;
    line-height: 1.5; caret-color: var(--mw-white);
    transition: all 0.2s; letter-spacing: 0.03em;
  }
  .mw-ta:focus {
    border-color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.07);
  }
  .mw-ta::placeholder { color: rgba(255,255,255,0.2); }

  .mw-cbar { height: 2px; margin-top: 5px; background: rgba(255,255,255,0.08); overflow: hidden; }
  .mw-cbar-fill { height: 100%; transition: width 0.12s, background 0.2s; }

  /* ── MISSION TYPE BUTTONS ── */
  .mw-types { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }

  .mw-tb {
    position: relative; padding: 0; border: none; background: none;
    cursor: pointer; outline: none; display: block; width: 100%;
  }

  .mw-tb-face {
    position: relative; z-index: 2;
    padding: 10px 4px 9px; text-align: center;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.03);
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
    transition: all 0.15s ease;
    transform: translateY(-3px);
  }
  .mw-tb::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: calc(100% - 1px);
    background: rgba(255,255,255,0.06);
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
    z-index: 1;
  }
  .mw-tb:active .mw-tb-face { transform: translateY(0) !important; }
  .mw-tb:hover:not(.mw-on) .mw-tb-face {
    border-color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.07);
  }
  .mw-tb.mw-on .mw-tb-face {
    transform: translateY(0);
    border-color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.12);
    box-shadow: 0 0 18px rgba(255,255,255,0.1), inset 0 0 8px rgba(255,255,255,0.04);
  }

  .mw-tb-emoji { font-size: 16px; display: block; line-height: 1; filter: grayscale(0.4); }
  .mw-tb-name {
    font-family: var(--mw-font); font-size: 7px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    display: block; margin-top: 4px; color: rgba(255,255,255,0.35);
    transition: color 0.15s;
  }
  .mw-tb.mw-on .mw-tb-name { color: var(--mw-white); }
  .mw-tb-min {
    font-size: 7px; font-weight: 600; color: rgba(255,255,255,0.3);
    display: block; margin-top: 2px; font-family: var(--mw-body);
  }
  .mw-tb.mw-on .mw-tb-min { color: rgba(255,255,255,0.55); }

  /* ── AMOUNT ROW ── */
  .mw-amt { display: flex; gap: 7px; }
  .mw-cur {
    display: flex; align-items: center; justify-content: space-between; gap: 4px;
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.18) !important;
    border-radius: 0 !important;
    color: var(--mw-white) !important;
    font-family: var(--mw-body) !important;
    font-size: 13px !important; font-weight: 700 !important;
    padding: 0 10px !important;
    min-width: 88px; height: 38px; cursor: pointer;
    transition: all 0.2s; flex-shrink: 0; letter-spacing: 0.05em !important;
  }
  .mw-cur:hover { border-color: rgba(255,255,255,0.45) !important; }

  /* ── DIVIDER ── */
  .mw-div {
    height: 1px; background: rgba(255,255,255,0.1); position: relative; overflow: visible;
  }
  .mw-div::after {
    content: ''; position: absolute; top: -1px; left: 0; width: 40%; height: 3px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    animation: mw-elec 2.5s ease-in-out infinite;
  }
  @keyframes mw-elec {
    0% { left: -40%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { left: 100%; opacity: 0; }
  }

  /* ── RANK TIERS ── */
  .mw-tiers { display: flex; gap: 5px; }
  .mw-tier {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 7px 4px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.02);
    clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .mw-tier.mw-tier-active {
    border-color: rgba(255,255,255,0.55);
    background: rgba(255,255,255,0.07);
    box-shadow: 0 0 15px rgba(255,255,255,0.06);
  }
  .mw-tier.mw-tier-active::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
    animation: mw-sweep 2.5s linear infinite;
  }
  .mw-tier-done { border-color: rgba(255,255,255,0.25); }
  @keyframes mw-sweep { to { left: 160%; } }
  .mw-tier-emoji { font-size: 13px; line-height: 1; filter: grayscale(1) brightness(0.8); }
  .mw-tier.mw-tier-active .mw-tier-emoji { filter: none; }
  .mw-tier-rank {
    font-family: var(--mw-font); font-size: 6px; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.25); text-align: center; line-height: 1.2;
  }
  .mw-tier.mw-tier-active .mw-tier-rank { color: var(--mw-white); }
  .mw-tier.mw-tier-done .mw-tier-rank { color: rgba(255,255,255,0.5); }
  .mw-tier-amt {
    font-family: var(--mw-body); font-size: 7px; color: rgba(255,255,255,0.2);
    letter-spacing: 0.04em;
  }
  .mw-tier.mw-tier-active .mw-tier-amt { color: rgba(255,255,255,0.6); }
  .mw-tier.mw-tier-done .mw-tier-amt { color: rgba(255,255,255,0.4); }

  /* ── SPECIALTY PANEL ── */
  .mw-sp {
    padding: 10px 12px; position: relative;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.03);
  }
  .mw-sp::before, .mw-sp::after {
    content: ''; position: absolute; width: 10px; height: 10px; pointer-events: none;
  }
  .mw-sp::before { top: 0; left: 0; border-top: 1px solid rgba(255,255,255,0.4); border-left: 1px solid rgba(255,255,255,0.4); }
  .mw-sp::after { bottom: 0; right: 0; border-bottom: 1px solid rgba(255,255,255,0.4); border-right: 1px solid rgba(255,255,255,0.4); }

  /* ── DEPLOY BUTTON ── */
  .mw-btn-wrap { position: relative; width: 100%; padding-bottom: 4px; }
  .mw-btn-wrap::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: calc(100% - 3px);
    background: var(--mw-grey-800);
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
    z-index: 1;
  }
  .mw-btn {
    position: relative; z-index: 2; width: 100%; padding: 14px; border: none;
    cursor: pointer; font-family: var(--mw-font); font-size: 12px; font-weight: 700;
    letter-spacing: 0.18em; color: var(--mw-black); text-transform: uppercase;
    background: var(--mw-white);
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
    transform: translateY(-4px); transition: transform 0.1s ease;
    animation: mw-btn-breathe 3s ease-in-out infinite;
  }
  @keyframes mw-btn-breathe {
    0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.15); }
    50% { box-shadow: 0 0 40px rgba(255,255,255,0.3); }
  }
  .mw-btn:hover:not(:disabled) {
    animation: none;
    box-shadow: 0 0 50px rgba(255,255,255,0.4), 0 0 100px rgba(255,255,255,0.1);
    background: var(--mw-grey-100);
  }
  .mw-btn:active:not(:disabled) { transform: translateY(0) !important; animation: none; }
  .mw-btn:disabled {
    opacity: 0.3; cursor: not-allowed; animation: none; color: rgba(0,0,0,0.5);
  }
  .mw-btn::before {
    content: ''; position: absolute; top: 0; left: -110%; width: 55%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg); transition: left 0.5s;
  }
  .mw-btn:hover:not(:disabled)::before { left: 160%; }

  .mw-hint {
    font-family: var(--mw-font); font-size: 8px; letter-spacing: 0.12em;
    color: rgba(255,255,255,0.3); margin-top: 4px;
  }

  /* ── FULLSCREEN BURST ── */
  .mw-burst-wrap {
    position: fixed; inset: 0; z-index: 99998; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.85);
    animation: mw-burst-bg 1.8s ease forwards;
  }
  @keyframes mw-burst-bg { 0% { opacity: 0; } 10% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }

  .mw-burst-lines {
    position: absolute; inset: 0;
    background: conic-gradient(
      rgba(255,255,255,0.9) 0deg 8deg, transparent 8deg 24deg,
      rgba(255,255,255,0.6) 24deg 30deg, transparent 30deg 46deg,
      rgba(255,255,255,0.8) 46deg 52deg, transparent 52deg 68deg,
      rgba(255,255,255,0.7) 68deg 74deg, transparent 74deg 90deg,
      rgba(255,255,255,0.9) 90deg 96deg, transparent 96deg 112deg,
      rgba(255,255,255,0.5) 112deg 118deg, transparent 118deg 134deg,
      rgba(255,255,255,0.8) 134deg 140deg, transparent 140deg 156deg,
      rgba(255,255,255,0.6) 156deg 162deg, transparent 162deg 178deg,
      rgba(255,255,255,0.9) 178deg 184deg, transparent 184deg 200deg,
      rgba(255,255,255,0.7) 200deg 206deg, transparent 206deg 222deg,
      rgba(255,255,255,0.8) 222deg 228deg, transparent 228deg 244deg,
      rgba(255,255,255,0.6) 244deg 250deg, transparent 250deg 266deg,
      rgba(255,255,255,0.9) 266deg 272deg, transparent 272deg 288deg,
      rgba(255,255,255,0.7) 288deg 294deg, transparent 294deg 310deg,
      rgba(255,255,255,0.8) 310deg 316deg, transparent 316deg 332deg,
      rgba(255,255,255,0.9) 332deg 338deg, transparent 338deg 354deg,
      rgba(255,255,255,0.6) 354deg 360deg
    );
    animation: mw-burst-spin 1.8s ease forwards;
    mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, transparent 30%, black 50%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, transparent 30%, black 50%, transparent 70%);
  }
  @keyframes mw-burst-spin {
    0% { opacity: 0; transform: scale(0.5) rotate(-20deg); }
    12% { opacity: 1; transform: scale(1.1) rotate(5deg); }
    50% { opacity: 0.8; transform: scale(1) rotate(0deg); }
    100% { opacity: 0; transform: scale(1.4) rotate(10deg); }
  }

  .mw-burst-text {
    position: relative; z-index: 2;
    font-family: var(--mw-font); font-size: 72px; font-weight: 700;
    color: var(--mw-white); letter-spacing: 0.12em;
    text-shadow: 0 0 30px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.2);
    animation: mw-burst-text-anim 1.8s ease forwards;
  }
  @keyframes mw-burst-text-anim {
    0% { opacity: 0; transform: scale(0.3) rotate(-8deg); }
    15% { opacity: 1; transform: scale(1.1) rotate(2deg); }
    40% { opacity: 1; transform: scale(1) rotate(0deg); }
    80% { opacity: 1; }
    100% { opacity: 0; transform: scale(1.15); }
  }

  /* ── MISSION COMPLETE ── */
  @keyframes mw-kc-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes mw-kc-out { from { opacity: 1; } to { opacity: 0; } }
  @keyframes mw-kc-bar { from { width: 0; } to { width: 100%; } }
  @keyframes mw-kc-tag { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mw-kc-scan { 0% { top: -10%; } 100% { top: 110%; } }

  .mw-kc-overlay {
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0,0,0,0.97);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    animation: mw-kc-in 0.3s ease forwards;
  }
  .mw-kc-overlay.mw-kc-exit { animation: mw-kc-out 0.4s ease forwards; }
  .mw-kc-scanline {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: mw-kc-scan 2s linear infinite; pointer-events: none;
  }
  .mw-kc-icon { font-size: 48px; margin-bottom: 16px; filter: grayscale(1) brightness(2); }
  .mw-kc-tag {
    font-family: var(--mw-font); font-size: 36px; color: var(--mw-white);
    letter-spacing: 0.15em; text-transform: uppercase;
    text-shadow: 0 0 20px rgba(255,255,255,0.3);
    animation: mw-kc-tag 0.4s ease 0.1s both;
  }
  .mw-kc-sub {
    font-family: var(--mw-font); font-size: 9px; color: rgba(255,255,255,0.3);
    letter-spacing: 0.25em; text-transform: uppercase; margin-top: 8px;
    animation: mw-kc-tag 0.4s ease 0.25s both;
  }
  .mw-kc-amount {
    font-family: var(--mw-font); font-size: 13px; color: var(--mw-white);
    letter-spacing: 0.14em; margin-top: 12px;
    animation: mw-kc-tag 0.4s ease 0.4s both;
  }
  .mw-kc-bar-wrap { width: 200px; height: 2px; background: rgba(255,255,255,0.1); margin-top: 24px; overflow: hidden; }
  .mw-kc-bar { height: 100%; background: var(--mw-white); animation: mw-kc-bar 2.2s linear 0.5s both; }
  .mw-kc-redirecting {
    font-family: var(--mw-font); font-size: 8px; color: rgba(255,255,255,0.3);
    letter-spacing: 0.2em; margin-top: 10px; animation: mw-kc-tag 0.3s ease 0.55s both;
  }

  /* ── RECONNECTING ── */
  @keyframes mw-rc-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
  .mw-reconnecting {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 99998; pointer-events: none;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .mw-rc-text {
    font-family: var(--mw-font); font-size: 11px; color: var(--mw-white);
    letter-spacing: 0.25em; animation: mw-rc-blink 0.9s ease-in-out infinite;
  }
  .mw-rc-dots { display: flex; gap: 5px; }
  .mw-rc-dot {
    width: 4px; height: 4px; border-radius: 50%; background: var(--mw-white);
    animation: mw-rc-blink 0.9s ease-in-out infinite;
  }
  .mw-rc-dot:nth-child(2) { animation-delay: 0.2s; }
  .mw-rc-dot:nth-child(3) { animation-delay: 0.4s; }

  /* ── KILL FEED ── */
  .mw-killfeed { position: fixed; top: 18px; right: 18px; z-index: 9999; display: flex; flex-direction: column; gap: 5px; pointer-events: none; }
  @keyframes mw-kf-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
  .mw-kf {
    display: flex; align-items: center; gap: 8px;
    background: rgba(0,0,0,0.92); border: 1px solid rgba(255,255,255,0.25);
    border-left: 2px solid var(--mw-white);
    padding: 7px 14px; min-width: 210px;
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
    animation: mw-kf-in 0.2s ease forwards;
  }
  .mw-kf-err { border-left-color: #ff4040; }
  .mw-kf-warn { border-left-color: #ff8800; }
  .mw-kf-icon { font-size: 10px; color: var(--mw-white); font-family: var(--mw-font); flex-shrink: 0; }
  .mw-kf-err .mw-kf-icon { color: #ff4040; }
  .mw-kf-warn .mw-kf-icon { color: #ff8800; }
  .mw-kf-text { font-family: var(--mw-font); font-size: 8px; color: var(--mw-accent); letter-spacing: 0.08em; }

  /* ── ANIM UTILS ── */
  @keyframes mw-in { from { opacity: 0; transform: scale(0.97) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .mw-in { animation: mw-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }

  @keyframes mw-fu { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .mw-fu { animation: mw-fu 0.16s ease forwards; }

  @keyframes mw-spin-a { to { transform: rotate(360deg); } }
  .mw-spin {
    width: 13px; height: 13px;
    border: 2px solid rgba(0,0,0,0.2); border-top-color: var(--mw-black);
    border-radius: 50%; display: inline-block; animation: mw-spin-a 0.65s linear infinite;
  }
`;

// ─── MISSION COMPLETE ─────────────────────────────────────────────────────────
const MissionCompleteOverlay: React.FC<{ amount: string; currency: string; onDone: () => void }> = ({
  amount, currency, onDone,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.classList.add("mw-kc-exit");
      setTimeout(onDone, 400);
    }, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div ref={ref} className="mw-kc-overlay">
      <div className="mw-kc-scanline" />
      <div className="mw-kc-icon">🎯</div>
      <div className="mw-kc-tag">Mission Complete</div>
      <div className="mw-kc-sub">Support deployed successfully</div>
      <div className="mw-kc-amount">{currency}{amount} CREDITS DEPLOYED</div>
      <div className="mw-kc-bar-wrap"><div className="mw-kc-bar" /></div>
      <div className="mw-kc-redirecting">▸ Redirecting to debrief...</div>
    </div>
  );
};

// ─── KILL FEED ────────────────────────────────────────────────────────────────
type KFMsg = { id: number; text: string; icon: string; variant: "default" | "err" | "warn" };
let kfId = 0;
const useKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMsg[]>([]);
  const push = useCallback((text: string, icon = "✦", variant: KFMsg["variant"] = "default") => {
    const id = ++kfId;
    setMsgs((p) => [...p, { id, text, icon, variant }]);
    setTimeout(() => setMsgs((p) => p.filter((m) => m.id !== id)), 3200);
  }, []);
  return { msgs, push };
};

// ─── AUDIO ────────────────────────────────────────────────────────────────────
const playClick = () => {
  try {
    const c = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.setValueAtTime(1200, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.05);
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
    o.start(); o.stop(c.currentTime + 0.07);
  } catch {}
};
const playConfirm = () => {
  try {
    const c = new (window.AudioContext || (window as any).webkitAudioContext)();
    [523, 659, 784].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination); o.frequency.value = f;
      const t = c.currentTime + i * 0.08;
      g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.start(t); o.stop(t + 0.12);
    });
  } catch {}
};
const playError = () => {
  try {
    const c = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination); o.type = "sawtooth";
    o.frequency.setValueAtTime(250, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.18);
    g.gain.setValueAtTime(0.07, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    o.start(); o.stop(c.currentTime + 0.18);
  } catch {}
};

const TIERS = [
  { min: 0,   rank: "CADET",     emoji: "🪖" },
  { min: 100, rank: "OPERATOR",  emoji: "🔫" },
  { min: 300, rank: "COMMANDER", emoji: "🎖️" },
  { min: 500, rank: "GENERAL",   emoji: "⭐" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const Brigzard = () => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const coolingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { msgs, push } = useKillFeed();

  const [formData, setFormData] = useState({ name: "", amount: "", message: "" });
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<"text" | "voice" | "hypersound" | "media">("text");
  const [selectedHypersound, setSelectedHypersound] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showMissionComplete, setShowMissionComplete] = useState(false);
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isCracking, setIsCracking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { pricing } = useStreamerPricing("brigzard", selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const currentAmount = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);
  const activeTierIdx = TIERS.reduce((best, tier, i) => (currentAmount >= tier.min ? i : best), 0);
  const intensityLevel = currentAmount >= 500 ? 3 : currentAmount >= 300 ? 2 : currentAmount >= 100 ? 1 : 0;
  const showGreeting = formData.name.trim().length >= 2;

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") {
      if (amount >= 500) return 15; if (amount >= 300) return 12; return 8;
    }
    if (amount >= 6) return 15; if (amount >= 4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  const applyScale = useCallback(() => {
    const wrap = wrapRef.current; const card = cardRef.current;
    if (!wrap || !card) return;
    const scaleW = Math.min(1, (window.innerWidth - 32) / 420);
    const scaleH = card.scrollHeight > 0 ? Math.min(1, (window.innerHeight - 48) / card.scrollHeight) : 1;
    const scale = Math.min(scaleW, scaleH);
    wrap.style.transform = `scale(${scale})`;
    wrap.style.height = `${card.scrollHeight * scale}px`;
  }, []);

  useEffect(() => {
    const t = setTimeout(applyScale, 80);
    window.addEventListener("resize", applyScale);
    return () => { clearTimeout(t); window.removeEventListener("resize", applyScale); };
  }, [applyScale]);
  useEffect(() => { const t = setTimeout(applyScale, 60); return () => clearTimeout(t); }, [donationType, applyScale]);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
    s.onload = () => setRazorpayLoaded(true);
    s.onerror = () => push("Payment gateway failed to load", "✖", "err");
    document.body.appendChild(s);
    return () => { if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDonationTypeChange = (value: "text" | "voice" | "hypersound" | "media") => {
    playClick();
    setDonationType(value);
    const amount =
      value === "voice" ? pricing.minVoice
      : value === "hypersound" ? pricing.minHypersound
      : value === "media" ? pricing.minMedia
      : pricing.minText;
    setFormData({ name: formData.name, amount: String(amount), message: "" });
    setSelectedHypersound(null); setMediaUrl(null); setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayLoaded || !(window as any).Razorpay) { playError(); push("Payment system still loading", "⚠", "warn"); return; }
    const amount = Number(formData.amount);
    if (!formData.name) { playError(); push("Callsign required", "✖", "err"); return; }
    if (!amount || amount <= 0) { playError(); push("Enter a valid amount", "✖", "err"); return; }
    const min = donationType === "voice" ? pricing.minVoice : donationType === "hypersound" ? pricing.minHypersound : donationType === "media" ? pricing.minMedia : pricing.minText;
    if (amount < min) { playError(); push(`Min for ${donationType}: ${currencySymbol}${min}`, "✖", "err"); return; }
    if (donationType === "voice" && !voiceRecorder.audioBlob) { playError(); push("Record voice first", "⚠", "warn"); return; }
    if (donationType === "hypersound" && !selectedHypersound) { playError(); push("Select a sound", "⚠", "warn"); return; }
    if (donationType === "media" && !mediaUrl) { playError(); push("Upload a file", "⚠", "warn"); return; }

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 320);
    setIsCracking(true);
    setTimeout(() => setIsCracking(false), 1900);
    setTimeout(() => processPayment(), 400);
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    push("Initiating deployment...", "◈", "default");
    const reconnectTimer = setTimeout(() => setShowReconnecting(true), 4000);
    try {
      let voiceMessageUrl: string | null = null;
      if (donationType === "voice" && voiceRecorder.audioBlob) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string).split(",")[1]);
          r.onerror = reject;
          r.readAsDataURL(voiceRecorder.audioBlob!);
        });
        const { data, error } = await supabase.functions.invoke("upload-voice-message-direct", { body: { voiceData: base64, streamerSlug: "brigzard" } });
        if (error) throw error;
        voiceMessageUrl = data.voice_message_url;
      }
      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: "brigzard", name: formData.name, amount: Number(formData.amount),
          message: donationType === "text" ? formData.message : null,
          voiceMessageUrl, hypersoundUrl: donationType === "hypersound" ? selectedHypersound : null,
          mediaUrl: donationType === "media" ? mediaUrl : null, mediaType, currency: selectedCurrency,
        },
      });
      if (error) {
        let msg = "Payment failed";
        if (error instanceof FunctionsHttpError) { try { const b = await error.context.json(); msg = b?.error || msg; } catch {} }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      clearTimeout(reconnectTimer); setShowReconnecting(false);
      new (window as any).Razorpay({
        key: data.razorpay_key_id, amount: data.amount, currency: data.currency,
        order_id: data.razorpay_order_id, name: "BRIGZARD", description: "Support BRIGZARD",
        handler: () => {
          playConfirm();
          setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`);
          setShowMissionComplete(true);
        },
        modal: { ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`) },
        theme: { color: "#141414" },
      }).open();
    } catch (err: any) {
      clearTimeout(reconnectTimer); setShowReconnecting(false);
      playError(); push(err?.message || "Payment failed. Try again.", "✖", "err");
    } finally { setIsProcessingPayment(false); }
  };

  const msgPct = maxMessageLength > 0 ? (formData.message.length / maxMessageLength) * 100 : 0;
  const msgClr = msgPct > 90 ? "#ff4040" : msgPct > 70 ? "#ffaa00" : "rgba(255,255,255,0.5)";

  const TYPES = [
    { key: "text" as const,       emoji: "💬", label: "Text",   min: pricing.minText },
    { key: "voice" as const,      emoji: "🎤", label: "Voice",  min: pricing.minVoice },
    { key: "hypersound" as const, emoji: "🔊", label: "Sound",  min: pricing.minHypersound },
    { key: "media" as const,      emoji: "🖼️", label: "Media",  min: pricing.minMedia },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {showMissionComplete && (
        <MissionCompleteOverlay amount={formData.amount} currency={currencySymbol} onDone={() => navigate(redirectUrl)} />
      )}
      {showReconnecting && (
        <div className="mw-reconnecting">
          <div className="mw-rc-text">RECONNECTING</div>
          <div className="mw-rc-dots"><div className="mw-rc-dot" /><div className="mw-rc-dot" /><div className="mw-rc-dot" /></div>
        </div>
      )}

      {isCracking && (
        <div className="mw-burst-wrap">
          <div className="mw-burst-lines" />
          <div className="mw-burst-text">DEPLOYED!</div>
        </div>
      )}

      <div className="mw-killfeed">
        {msgs.map((m) => (
          <div key={m.id} className={cn("mw-kf", m.variant === "err" ? "mw-kf-err" : m.variant === "warn" ? "mw-kf-warn" : "")}>
            <span className="mw-kf-icon">{m.icon}</span>
            <span className="mw-kf-text">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="mw-root mw-page">
        <div className="mw-grid" />
        <div className="mw-noise" />
        <div className="mw-scan" />
        <div className="mw-vignette" />

        <div ref={wrapRef} className="mw-scale-wrap" style={{ transformOrigin: "top center" }}>
          <div ref={cardRef} className={cn("mw-card mw-in", intensityLevel > 0 && `mw-int-${intensityLevel}`, isShaking && "mw-shaking")}>
            <div className="mw-bracket mw-bracket-tl" />
            <div className="mw-bracket mw-bracket-tr" />
            <div className="mw-bracket mw-bracket-bl" />
            <div className="mw-bracket mw-bracket-br" />

            {/* HERO */}
            <div className="mw-hero">
              <div className="mw-hero-top">
                <img
                  src={`data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAe8B2YDASIAAhEBAxEB/8QAHQABAAMAAwEBAQAAAAAAAAAAAAcICQQFBgMCAf/EAGIQAQABAwMBBAQGDQcIBgcECwABAgMEBQYRBxIhMUEIE1FhFBgiVnGlCRUWIzJCUmJygZGU0xczgpWh0dIkQ1RXZ5Kz5DZjdYOisSU0c3STssE1N1Wjw/BEU3a01OFkZcL/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8ApkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwXoX9Gp6ib0+6TXcTt7X0S7TVcprp+RmZEfKps+yaY7qq49nET+ECffQY6O17O2vO/Nfxqreu61YinFs3I4qxcSZiqOY8qrnEVT7KYpjuntQsyRERHERxEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADr9R0LRNRyPhGoaPp2ZeimKfWX8ai5VxHlzMc8OwAdN9ye1vm1o37ja/wn3J7W+bWjfuNr/C7kB033J7W+bWjfuNr/Cfcntb5taN+42v8LuQHTfcntb5taN+42v8J9ye1vm1o37ja/wu5AdN9ye1vm1o37ja/wAJ9ye1vm1o37ja/wALuQHTfcntb5taN+42v8J9ye1vm1o37ja/wu5AdN9ye1vm1o37ja/wn3J7W+bWjfuNr/C7kB033J7W+bWjfuNr/Cfcntb5taN+42v8LuQHTfcntb5taN+42v8ACfcntb5taN+42v8AC7kB033J7W+bWjfuNr/Cfcntb5taN+42v8LuQHTfcntb5taN+42v8J9ye1vm1o37ja/wu5AdN9ye1vm1o37ja/wn3J7W+bWjfuNr/C7kB033J7W+bWjfuNr/AAn3J7W+bWjfuNr/AAu5AdN9ye1vm1o37ja/wn3J7W+bWjfuNr/C7kB033J7W+bWjfuNr/C8B6QOobB6c9L9T3LqO1Nu5N+iPVafjXtPtVRfyqomLdPE0+Ed9U/m01JYZxemv1U/lA6mVaJpeT29A29VXjWJpq5pv3+eLt3u8Y5iKafHup5j8KQQTlX7mTlXcm9NM3Ltc11zTRFMczPM8RHERHujufIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf2imquuKKKZqqqniIiOZmQel6X7J1nqHvjTtp6Hb5ycy5xXdqpmaLFuO+u7Xx4U0x3+/uiO+YapdOdoaPsPZmm7V0Kz6vCwbUURVMfKu1z31XKvbVVVMzP0+xFHoc9HI6abH+3GtY9NO6Nat03MrtR8rFs+NFiPZPhVV+d3d/ZiU7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+GoZeLp+BkZ+bft4+LjWqr167cnim3RTEzVVM+URETIIW9Mnqp/Jx0xuYWmZMW9wa7FeLhdmr5dm3x99vR7OzExET+VVE+Us10iekN1JyuqPU/Udx11XKdOon4Ppliuf5rGpmez3eVVXfXPvqmPCIR2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAtN6CfRr7pdfp6kbixO1o+lXuNMtXI7snKp/znHnRbnv99fH5MwhXoT021Pqn1Dwts4PrLWLz67UMqmOYxsemY7Vf6U8xTTHnVMeXMtStr6Hpe2dvYGgaLi0YmnYFimxj2qfxaYjz9sz4zPjMzMyDsgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFUPsgXVSNI27Y6Z6Pk8Z2q0Rf1SqirvtY0T8m33eE11RzP5tPfHFayHUTdel7H2Vqu69Zr7OHp1ibtVMTxVcq8KaKfzqqpimPfLKPf26dV3rvLVN061d9ZnajkVXq+/mKI8KaKfzaaYimPdEA6IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfuxZu371Fmxaru3a54poopmqqqfZER4vzMTE8THEwD+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPvgYmTn52Pg4Vi5kZWRdptWbVuntVXK6p4ppiPOZmYjh8FyvQI6NTVVT1V3JifJjtW9DsXaPGfCrJ4n9dNP9KfyZBO3ovdJcXpR08tYd+i3c1/UYpyNWvxxPy+Pk2qZ/IoiZiPbM1T58JYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEcekb1Lx+lvS/P3BFVFWp3o+C6XZq4nt5FUT2ZmPOmmImufdTx4zAKsen/wBVPt5umz030fJ7WnaPXF3UqqKu67lzHdRPti3TP+9VMT30qqvtm5WRm5l/MzL9zIyb9yq7eu3KpqquV1TzVVMz4zMzM8viAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD1HSrZep9Qt/wCk7S0qJpvZ16Kbl3s8xYtR33Lk+6mmJn390eMgsx9j46V/Cs/I6pazjc2caa8XRqa4/CuccXb39GJ7ET7aq/OmFlOpXRPpp1Bi5d3BtjFjOrif8vxI9Rk8+2a6eO3/AE4qj3PYbR0DTNrbY07bmj2IsYGnY9OPYo8+zTHjPtmZ5mZ85mZdoCjHVD0L9xad63N6f65Z1rHiOYwc+YsZP0U1x97rn3z2FZ93bV3JtHVKtM3PoefpGXHPFvKszR24jzpme6qPfEzDX91m5dv6HubS7ml7h0jB1XCufhWMuzTco59sRMd0++O8GPQvX1X9DPbeqRdzunmrXNCyp5mMDNqqvYtXsimvvuUfTPb+iFSepnSvfnTnM9Ruzb2Vh2Zni3l0R6zGufo3aeaefdMxPtiAeKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2O2tF1Pcev4OhaNiXMvUM6/TYx7NEd9VVU8R9EeczPdERMyCRfRj6TZfVjqHawL1F2jQcCacjVsinmOLfPdaifKuviYj2RFU/itO9Pw8TTsDHwMHHtY2JjWqbVizapimi3RTHFNMRHhERERw8R0F6aaZ0r6eYe28KaL2ZV9/wBRy4j/ANYyJiO1V3/ixxFNMeURHnzL3wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEzERzM8RDNL0wuqk9SuqF2xp2R6zb+iTXiaf2auabtXP3y/wD0piIifyaafetb6bvVSdh9Np2/pWT6vXtw012LU0z8qxjeF257pmJiiP0pmPwWc4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC/8A6BXSv7ltjV781fG7Gsbgtx8FiqO+zhcxNP67kxFf6MW/DvVV9Fzphd6o9UsPTcm1VOiYHGXqtffEeqpnut8+2urin28dqfJqBZtWrFmizZt0WrVumKaKKKYimmmI4iIiPCAfsAAAB8c7Exc/Du4edjWcrGvUzRds3rcV0V0z4xVTPdMe6X2AVm6w+iDs3cvrtR2PkfcvqdXNXwfibmFcn9H8K3/R5iPyVOuqfSXfvTXMm1urQr1jGmrs2s6z99xbvs7NyO6Jn8mrir3NXnwz8PE1DCvYWfi2MvFv0TRds3rcV0XKZ8YqpnumPdIMbhfTrR6H22df9fqnTzKo27qMxNXwC9NVeFdq9099Vrn3dqnwiKYUy6ibB3d0/wBZnSt26Jk6bfnn1Vdcdq1eiPxrdcc01R9E93nwDzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC9/oIdGvue0KnqXuHFiNW1OzxpVqunvxsaqP5z3VXI8PZR+lMRAnoe9HKup2+ftprONNW1tGuU3MztRxTlXfGixHtieOavZT3d01RLSOimmiiKKKYpppjiIiOIiAf0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABw9b1PA0XR8zWNUyaMXBwrFeRkXq/C3boiZqqn6IhzFP/sg/VT4LgY/S3R8ji9kxRlaxVRPfTb55tWZ/SmIrmPZFHlMgq91y6g53U3qVqm68vt27N6v1WDYqnn4PjU8xbo+njmqeO6aqqp83iAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfq3RXcuU27dNVddUxFNNMczMz5Q/KyPoI9K43hv+remr43b0XbtymuzFdPyb+Z40U++KI4rn3+r8pBaz0U+l1PS/pbjYeZZpp13U+zmapV501zHybX0UUzx7O1NUx4pbAAAAAAAAAB1e6dvaHunRr2jbi0rE1TT70fLsZNuK6efKY58Ko57pjiY8pdoApP1z9DvLxIv610syKsuzHNdWjZd377THss3Z7qv0a+J/OqnuVJ1bTtQ0jUr+m6rhZGDm49fYvY+Rbm3ct1eyqme+JbHPAdYekGyOqWmfB9y6ZTGdRR2cbUsfijJsePHFXHyqe+fk1c0+7nvBlMJl68ejxvXpbcu6h6qrW9uRMzTqeLbn71HPdF6jvm3Ph399Pf489yGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHf8AT3aWs753jpu1tBseuzs+7FFPP4NunxquVT5U00xNU+6HQNE/Qs6Nfye7N+6fXsXsbm1u1TVVRcp+Vh43jTa9sVVd1VXv7Mfi94S70r2Po3TrY2n7T0Oj/J8Sj75eqiIryLs99d2v86qf2RxEd0Q9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPL9Vd66Z092Dqu7dVqibODZmbdrtcVX7s91u3T76qpiPdHM+EMpN26/qe6dzajuLWb/r9Q1HIqv36/LtVT4RHlTHdER5REQsJ6enVT7qt80bE0jJ7WkbfuT8Kmmfk3s3jir6YtxzRH503PGOFZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdltjRNS3LuLA0DR8arJ1DUL9OPj24/GqqniOZ8o85nyiJlq10i2PpvTnp7pW0tM4qow7X3+9xxN+9V33Lk/TVM8R5RxHkrJ9j36V+rs5HVTWcf5Vzt4mi010+Efg3b8fT324n3V+5ccAAAAAAAAAAAAAAH5u0UXbdVu5RTXRXE01U1RzFUT4xMKr+kD6JOj7g+Ea/00+D6Nqk813NKqns4mRPj97n/M1T7PwPD8HvlaoBj1ujQNa2xrmTom4NMydN1HGq7N3HyKOzVT7J98T4xMcxMd8TMOsavdYOlOzuqWiTp+5tPici3TMYufZ4pyMaZ86avOPbTPNM+znvZ79euhW8Ok2fVdzrU6loFyvs42rY9ufVzz4U3I/zdfumeJ8pnvBFIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPZdGenur9Td/wCBtXSaaqPWz6zLyezzTjWKZjt3Kvo5iIjzqmmPMEy+g50aneW6Y33uHE7W39GvR8FtXaOaczKjviOPOijuqnymezHf8rjQF1GzNt6RtDa+n7a0HFpxdO0+zFmzRHjxHjVVPnVM8zM+czMu3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARV6UfU+30u6W5ep41ymNbz+cTSqJ8Yu1R33OPZRHyvZz2Y80qXK6LdFVy5VTRRTEzVVVPEREecsxPSs6o19UOqWVmYd6atB0ztYelU+VVuJ+Vd+muqOfb2ezE+AImvXLl67Xdu3Krlyuqaq66p5mqZ75mZ85fgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHsui2wtQ6ldR9L2ngduijJudvLv0xz8Hx6e+5cny7o7o58appjzeNaIeg10r+4jp191WrY3Y13cVFN3iuniqxieNuj3TV+HP00xPfSCetv6Rp+gaFg6JpONTjYGDYox8e1T4UUUxERHv7o8fNzgAAAAAAAAAAAAAAAAAcbVMDB1TT7+naliWMzDyKJt3rF+3Fdu5TPjTVTPdMOSAo56SfooZejRk7p6YWL2bp0c3MjRuZrvY8eMzZme+5T+bPNUeXa8ql101UVzRXTNNVM8TExxMS2XV19Jj0Z9G6hUZO5dpU4+kbq4mu5T+Dj58/nxH4Nyfy48fxufGAzxHY7l0LV9ta5laJr2nZGnajiV9i/j3qeKqZ/+sT4xMd0x3x3OuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB+7Fm7kX7dixaru3blUUW7dFM1VVVTPERER4zM+TTH0T+kFnpVsCmdQtUVbl1amm9qdyO/1XdzRYifZREzzx41TVPfHHED+gT0a+2GdT1U3FixOJi1zRolm5T/OXYnirImPZRPNNP53M93Zjm7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOt3Rrmm7a27qGv6xkRj6fp+PXkZFyfKmmOZ49sz4RHnMxAK/wDp39U42hsCNlaVkdnWtxW6qb00z8qxheFc/TXPNEe2O35xDPl6zq9vjUuo3UPVd26lzTVmXfvFnnmLFmnut24+imI5nznmfN5MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH0xrF7JybWNjWq7167XFFu3RTzVXVM8RERHjMyCYPRG6WVdTeqNiM+xNe39H7OXqVUx8m5xP3uz/TmJ5/NpraZ0xFNMU0xEREcREeSM/Ro6ZWOlnS7B0W5RbnWMrjL1W7TxPav1RHyInzpojimPKeJnu7UpNAAAAAAAAAAAAAAAAAAAAAABGPXzovtbq3oXqdSt04WtY9Exg6rao5uWfPs1R+Pb5/Fnw5mYmJ72cPVTp7ufpruq7t7dGF6i9HNVi/R8qzk2+eIuW6vOJ490x4TES1seT6q9Pds9Stq3tvbnwovWZ5qx79HddxrnExFy3V5THP0T4TEwDJMSR166P7l6SbmnA1WicrS8iqqdO1K3TxbyKI8p/JriOOaZ+mOY4lG4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACSvRy6WZ/VjqJj6LRF21pONxkarlU93qrET+DE+Hbrn5NMd/nPHFMvA6LpmfrWr4mkaVi3MvPzL1NjHsW45quV1TxTTH65aiejt0t0/pR07xtDtervapkcZGqZVMfz1+Y74ifyKfwafdzPjMg97o+m4Oj6TiaTpeLbxMHDs02Mexbjim3bpjimmPdEQ5YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKX/ZCOqk138fpXo2T8m32MvWqqKvGr8K1Yn6I4uTHvt+yVnutO/tP6adOdU3Zn9iuvHt9jEsVTx8IyKu63b9vfPfPHhTFU+TKfX9W1DXdczta1XJqyc/Ov15GRdq8a7lczNU+7vnwBwQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFo/QE6VzuLeF3qHrGNM6XodfYwIrp+TezJjntR7YtxMT+lVRMeEq67I23qm8N26ZtjRbPrc/UsimxZifCnnxqq9lNMc1TPlES1c6abP0vYWxtK2no9ERjafYiia+OJu1z313KvfVVMzP0g9GAAAAAAAAAAAAAAAAAAAAAAAAADpd8bV0Hem2czbm5NPt52nZdHZrt1x30z5V0z401RPfEx3wzd9JDohrnSLcETzd1HbeXXPwDUex5+PqrvHdTcj9lUd8ecRp463c+haRubQMzQdewLOfpubbm3fsXY5pqj/ziYniYmO+JiJjiYBjyJl9JvoXq/STX/hWL67P2rm3JjBzpjmq1Pj6m7x3RXEeE+FURzHExMRDQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJn9Ezo/e6p7/pu6jYrjbOk1U3tSuTExF6eeaceJ9tXHf7KYnzmOQnn0CujX2s0+nqluPF4zcy3NGi2blPfas1RxVf7/AMauO6n83me/txxbh+LFm1j2LdixaotWrdMUUUUUxTTTTEcRERHhER5P2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACG/S56px0y6XX6sDIpo3BrHaxNNiJ+Vb7vvl7+hTPdP5VVAKp+nL1U+7fqL9yuk5Pb0LbtdVrmirmnIy/C5c7vGKeOxH0VTH4Su7+1TNVU1VTMzM8zM+b+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA990C6dZnVDqbpu2bEXKMOavX6jfp/zONRMdufpnmKY/Oqjy5BaP7H10r+1ui5HU/WcbjL1CmrG0iiunvt2Ini5dj2TXVHZjw+TTPjFa27jaXgYel6Zi6bp2NbxsPEs0WMezbjim3bpiIppiPZEREOSAAAAAAAAAAAAAAAAAAAAAAAAAAAADrdz6FpG5tAzNB17As5+m5tubd+xdjmmqP8AziYniYmO+JiJjiYZt+k50Q1TpHuSm7jVXs7bGfXPwDNqp+Vbnx9TdmO6K4jwnwqiOY8JiNNnU7v25ou7duZm3tw4FrP03Mt9i9ZuR4+yYnxiqJ4mJjviYiYBj6JS9Izo5rPSLd3wO/NeZoeZNVem6h2OIuU899uvyi5T3cx5xxMePERaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADudk7Z1feO69O2zoWNVk6jqF6LVmiPCPOaqp8qaYiapnyiJlqd0b6f6R0z2BgbV0imKvU09vKyOzxVk36ojt3J+mY4iPKIiPJDnoPdGo2XtSN86/i9ncGtWInHt1xxVh4lXExTx5V18RVPsjsx3T2llAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfPKv2MXGu5WTet2bFmibl25cqimmimI5mqZnwiI7+WXHpLdTL3VLqlna3bruRpGN/kmlWqu7s2KZniuY8qq55rnzjmI/Fhaj0++qkbd2fb6d6Rk9nVNct9vPqoq77OHzx2fdNyY4/RpqjzhQoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABpD6FvSuenvTKjVtUxvV7g1+mjJyYrp+VYs8c2rXtieJ7VUe2rifwVUvQx6Vx1E6n0ajqmN6zb+gTRlZkVR8m9d5+9WffEzE1THh2aJifGGkgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPO9R9l6B1A2hmbX3Ji/CMHKjxpni5Zrj8G5RV5VUz4T+qeYmYnMLrZ0y1/pVvW/t3WqfW2Z++YOdRRMW8uz5VU+yY8KqfKfbHEzq+8J1x6YaF1V2Rf2/q9NNnJoibmn51NETXiXuO6qPbTPdFVPnHsmImAyiHfb/ANpa5sbduftjcWJONn4Vzs1R403KfGmuifOmqOJiff7XQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALE+hR0a+7/eH3Wa9ixXtrRL0T2K6eaczJjiqm3x50091VX9GO/tTxEHSjY2s9Rt96dtTRLf3/Kr5u3pjmjHsx313avdTH7Z4iO+Yao9P9p6PsfZ+m7W0Gx6nAwLMW6Ofwq6vGquqfOqqqZqmfbMg70AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0+99yaXs/aWp7n1q96rA03Hqv3pjxnjwpp9tVU8UxHnMxDuFHfsgvVSNT1rH6Y6NkxViadVTk6tVRV3V5Ex8i19FFM9qY7/lVR4TQCtnUreGq793xqu7NZrmcrUL83Ox2uabNHhRbp/NppiKY+h5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHI03Cy9S1HG07Ax7mTl5V2mzYs245quV1TxTTEe2ZmIcdbP7H50r+2uvX+pusY3OFptdWPpVNcd1zImPl3OPZRTPET+VV7aQWl9H7pzidL+mGm7ZtRbrzpj4RqV+mP57JriO3PPnEcRRH5tMJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEL+lX0Uw+rG0vhWnW7NjdWm25nT8ie711PjOPXP5M9/Zmfwap58Jq5zW1HDy9Oz8jAz8e7jZeNdqtX7N2maa7ddM8VUzE+ExMTHDZFU705Ohsa5p9/qbtTD51TEt9rWMa1T35NmmP56I866Ijv9tMc+NPeFGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6t0V3LlNu3TVXXVMRTTTHMzM+UPytb6B/Rr7fa1T1N3Fi9rS9OuzTpNm5TzGRk0zxN3v8abc+Htr/QmJCevRA6O0dMNiRqOr40U7o1mim7ndqImrGt+NGPE+7xq9tXtimE4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwPX3qLh9L+mWpbmv9ivMin1GnWKv89k1RPYj6I4mqfzaZZXapn5mqanlanqOTcyczLvV38i9cnmq5cqmZqqmfbMzMpu9NHqp/KF1OuaTpeT6zb+gVV4uL2KuaL97ni7e9/Mx2Ynw7NMTH4UoIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6HpxtLVN9740raej0c5eo34tRXMc02qPGu5V+bTTFVU+6Gruxts6Vs3aGmbX0Wz6rA03Hps2onxq476q6vbVVVM1TPnMyrp6APSz7n9pXuour43Z1LW6PV6fFcd9rDiee17puVRz+jTTMfhStKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATETHExzEgDPH00eic9Pt0Tu3buJ2dr6vemZt26fk4ORPfNv3UVd80+ziae7iOa6tgt5bc0jd219Q23r2JTladn2Zs37c+PE+FUT5VRPExPlMRLLTrd041fpd1Azdr6p2rtqmfW4OX2eKcrHmZ7FyPZPdMTHlVEx3+IPEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5GnYWXqWoY+n4GPcycvJu02bFm3T2qrldU8U0xHnMzMQD3HQLplqfVXqHibdw/WWcGj79qWXFPMY9iJ75/Sn8GmPbPsiZjUnbmjaZt7QcHQ9GxLeJp+DYpsY9mjwoopjiPpn2zPfM8zKO/Rm6T4fSfp5Z065Rbua7ndm/q2TT39q5x3W6Z/IoieI9s9qfxkpgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIL9M/qp/J30wuaZpmV6vcOvxXi4nYq4rsWuPvt73cRMUxPj2qomPwZTZqediaZpuTqWoZFvGxMW1Vev3q54pt0UxM1VT7oiJllf6QXUbL6odT9S3Ldm5RgxPwfTbFU/wAzjUTPYjjymeZrn86qQR+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkv0bemmR1S6o4GhVUVxpWP/AJVql2O7sY9MxzTE/lVzMUx9PPlKNYiZniI5mWmPohdLI6Z9LrFWoY/q9w6zFOXqXa/Ctd33uz/Qpmefzqq+/jgEw4mPYxMWziYtmizYs0U27VuiOKaKYjiIiPKIiOH1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEvpRdI8Xqx0+u4uPRbt7h06Kr+lZFXdzXx8qzVP5NcREe6ezPlxMtAMbc7FycHNv4WbYuY+Tj3KrV6zcpmmu3XTPFVNUT3xMTExMPiuN6fPRz1N6rqtt7G+93Jota5Zt0/g1fg0ZHd7e6mr39mfOqVOQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF0fQI6NRbtUdVtxYv3yuKrehWbkfg099NeRMe/vpp93anzplBPot9JMnqv1DtYuTbuUbe02ab+rX6e7mjn5Nmmfyq5iY90RVPlxOnGFjY+Fh2MPDsW8fGsW6bVm1bpimm3RTHFNMRHhERERwD6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA891I3dpWxNkaruzWa+ziafYm5NHa4qu1+FFun86qqYpj3yCtv2QTqpOlaFj9MtGyezmalRGRqtVE99GPE/Itc+2uqOZ/NpjyqUad1vncuqbx3dqm6Navetz9SyKr92Y54p58KKefCmmmIpiPKIiHSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5ug6Vn67reFo2lY1eTn51+jHx7NHjXXVMRTH7ZBPHoO9LPu56kfdNquN6zQtu103qorp5pyMrxtW/ZMU8dur6KYmOKmibxfRLYOB006b6XtTC7NdyxR6zMvxH8/kVd9yv6Oe6PZTFMeT2gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAONq2n4WraXlaXqWNbysLLs1WMizcjmm5RVExVTPumJllt6RHTHO6U9SMvb931l7Tb3+UaXk1R/PY9UzxEz+XTPNNXvjnwmGqSJfSm6U2eqnTW/h4lqiNf03tZWlXZ4iZriPlWZmfxa4jj2RVFMz4AzBH7v2buPfuWL9qu1dt1TRct10zTVTVE8TExPhMT5PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7Paug6rufceBt/RMSvL1HPv02Me1T+NVPtnyiO+Zme6IiZnuh1i+voKdGvuX29HUXcWJ2da1azxp1q5T34uLV39v3V3O6fdTx+VVAJq6G9ONK6W9PcLbGndm7fiPXZ+VEcTk5FUR26/o7oppjyppjz5l7kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFDfT96qfdBu2z060fJ7Wm6Jc9ZqE0z3XcyY47Pvi3TPH6VVUT4QtP6SnUuz0t6W5+u267c6tkf5JpVqrv7WRVE8VTHnTRETXPt7PHnDLfLyL+XlXsvKvV3r96uq5duVzzVXVVPMzM+czM8g+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4n2PfpXF/JyOqms43NuzNeJotNdPjX+Ddvx9Ec24n2zc84hWXpLsjU+onUDStpaXFVNzNvRF692eYsWY77lyfdTTEz754jxmGrm1dC0zbG29P29o2PGPp+n49GPj248qaY45mfOZ8ZnzmZkHZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAob6fPSf7nt00dR9FxuNM1q72NRoop7rOXxz2/dFyImf0oq5/ChVlr31A2rpW99maptXWrc14Oo2JtVzH4VE+NNdP51NURVHviGUXULauqbI3pqu1NZt9jN07Im1XMfg3KfGmun82qmaao90wDoQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAej6a7N1nf29dO2roVn1mXm3YpmuYnsWaI767lfsppjmZ/ZHfMQCWPQ26N1dSd7xrmtY3a2vot2mvJiunmnLvxxNFj3x4VV/m8R+NExo5TEU0xTTERERxER5PN9Mdl6N0+2Rp21NDtdnFwrfFVyY4rv3J767lX51U8z7u6I7oh6UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmYiOZniIFevTi6pxsfpvO2NKyOxru4qKrETRPyrGL4XbnumrnsR9NUx30gqn6XvVOepnVK/Gn5HrNv6N2sPTezPybvf98v/ANOqI4n8mmjz5QwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJZ9FbpdX1R6pYuBl2a6tC07jM1WuI7ptxPybXPtrq+T7ez2pjwBav0D+lf3JbDq3vq+P2dZ3Dbpqx4rp4qsYfPNEfTcniufd2Peso/Nqii1bpt26KaKKIimmmmOIpiPCIh+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFUfsgnS6NY2zj9StJx+c7SaYx9TiiO+5izV8mv3zRVPH6NczPdStc4+p4OJqem5Om6hj28nEyrVVm/Zrjmm5RVExVTPumJmAY3j3HXXYGV006nattS/NyvHs3PW4N6uO+9jV99ur3zx8mfzqanhwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf2ImZ4iOZlox6GXRunpzsr7odcxezujWrVNd6K4+ViY88TRZ91U91VXv4j8VAnoL9Go3ZuSOoO4cXtaHo9+IwbVyO7Ky6eJir30W+6ffVxHfxVC/QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOFr2q4GhaJm6zquTRjYGDYryMi9X4UUUxM1T+yGVHWvf8AqHUzqPqm7M7tUW79fq8OxV/mMenmLdH08d8+2qap81oPshHVP1GNjdLNGyeLl6KMvWqqKvCjxtWJ+meLkx7It+2VKwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfq1RXduU2rVFVddcxTTTTHM1TPhER7Wn3osdL7fS7pbiYGVZop13UeMvVbkR3xcmPk2ufZbp+T7Oe1MfhKregb0rndm+q986tjdrRtv3InHiun5N/M45pj/u44rn3zR72gIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK2env00p3T03o3rpuN2tW25E13ppj5V3DmfvkT7exPFfujt+1n02TzcbHzcO/h5Vqm9j37dVq7bqjmK6Ko4mJ90xLKTrtsO/wBNuqWs7UudurGsXfWYV2r/ADmPX8q3PPnPE9mfzqZB4cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB7bol061Xqh1Bwdr6Z2rduufW5uTxzGNj0zHbuT7Z74iI86piPe8diY9/LyrOJi2bl/IvV027Vq3TNVVdVU8RTER3zMzPHDTT0VukVjpR0+os5tq3VuPU4pv6rdjiexPHybETHjTRzP01TVPhMAkvaW39K2rtrT9u6Hi04unafYps2LceVMecz5zM8zM+czM+btAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeU6t740zp10/1XduqcVW8O195s88TfvT3W7cfTVMfRHM+T1bPz08Oqk7t37TsjScntaNt65NORNFXNN/M8K5+i3HNEe/t+2AV93Trmpbm3HqG4NYyJyNQ1DIryMi5xxE1VTzPEeUR4RHlERDrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdntTQtT3PuXTtvaNjzkahqGRRj2KPKaqp45mfKI8ZnyiJl1i6v2PfpX6jEyOqes4332/FeJotNdP4NH4N29H0zzbifZFflVALM9JtkaZ072BpW0tKiKrWFa4u3uzxVfvT33Lk++qqZn3RxHhEPVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqz9kM6e/bnY2Bv/AsdrN0Ov4PmzTT314tyrumfP5FyY491yqfJaZwNx6Pgbg2/qGhapZ9dg6hjXMbIo/KorpmmePZPE+IMdh3vUHbGfsze2sbV1KP8p0zLrx6quOIuRE/Jrj3VU8VR7ph0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQ9GvpTm9WOodjSpi5a0XD7ORq2TTH4Frnuopn8uuYmmPZ3z39mYBOXoE9GvhWRT1V3HifeLNVVGh2blPdXXHdVkceynvpp9/anypldZxtKwMLStMxdM07Gt4uHiWqbNizbjim3RTHFNMR7IiIckAAAAAAAAAAAAAAAAAAAAAAAAAEd9X+s+wul+JV90erU3NRmjtWtMxOLmVc58J7PPFET+VVMR9IJEGeXUP0vep+t6167al/G2tp1vmLVi3j2sm5XHtuV3aJiZ/RppiOfPxea+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8E+NH12+fP1ThfwQaZDM340fXb58/VOF/BPjR9dvnz9U4X8EGmQzN+NH12+fP1ThfwT40fXb58/VOF/BBpkMzfjR9dvnz9U4X8Fycf0rOuFq32a9149+eee1c0vGifo+TbiAaUjNr42HW35x4X9WWP8ACfGw62/OPC/qyx/hBpKM2vjYdbfnHhf1ZY/wnxsOtvzjwv6ssf4QaSjNr42HW35x4X9WWP8ACfGw62/OPC/qyx/hBpKM2vjYdbfnHhf1ZY/wnxsOtvzjwv6ssf4QaSjNr42HW35x4X9WWP8ACfGw62/OPC/qyx/hBpKM2vjYdbfnHhf1ZY/wnxsOtvzjwv6ssf4QaSjNr42HW35x4X9WWP8ACfGw62/OPC/qyx/hBpKM2vjYdbfnHhf1ZY/wnxsOtvzjwv6ssf4QaSjNr42HW35x4X9WWP8ACfGw62/OPC/qyx/hBpKM2vjYdbfnHhf1ZY/wnxsOtvzjwv6ssf4QaSjNr42HW35x4X9WWP8ACfGw62/OPC/qyx/hBpKM2vjYdbfnHhf1ZY/wnxsOtvzjwv6ssf4QXM9KnqhR0v6WZediX6add1HnD0qjumYuTHyrvHst0/K9na7MT4swrtdd25Vdu11V11zNVVVU8zVM+MzPteu6pdSt49TNUxNR3hqkZ17EszZsU0WaLVFumZmZ4ppiI5mfGfGeI9kPHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9t0Q6f5/UzqTpm1MLtUWr1frc2/EfzGPTxNyv6eO6PbVVTHm1W0LS8DQ9FwtG0vGoxcHCsUWMezRHdRRTEREfshA/oP9K/uF6bxuXVcbsa9uKii/XFdPysfF8bVv2xNUT26vDxpiY5pWEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABR/7IzsT4FuPRuoWFYiLOo0fAM+qmnj79bjm1VPtmqjmn6LUKjtWPSI2THUHo7uDbluzFzNqxpyMDu74yLfy7cR7O1MdmZ9lUsqJiYniY4mAfwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHO0DSdR17W8PRdIxLmXn5t6mxj2bcfKrrqniI/8A7+TUf0femGndKenmLt/G9Xe1C79/1PLpj+fvzHfxz39mmPk0x7I58ZlCPoG9Go0bSKep+4sTjUc+1NOj2rlPfYx6u6b3H5Vcd0fmfprYgAAAAAAAAAAAAAAAAAAAAAAA6/cOt6Pt3SL+r67qeJpmBYjm7kZV2LdFPsjmfOfCI8Z8gdg8z1C37tHYGjzqu7dcxdMsTz6umurm7emPK3bjmqufoiePNV7rX6ZFq3F/SOlmFF2riaZ1nOtTFMe+1Znx901/7sqh7p3Fru6dZvaxuLVszVM+9PNd/JuzXVx7I58KY8ojiI8oBY/rX6X+5Nwxf0np5jXdu6bVzTOfd4qzbse7jmm1+qaqvOKoVhzcrJzcu7mZmReycm9XNd29drmuu5VM8zVVVPfMz7ZfEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATR6IPSz+UzqjZq1HH9Zt/Rezl6l2o+Tdnn73Z/p1RPP5tNXnwhzDxsjMy7OHiWbl/Iv3Kbdq1bp5qrrqniKYjzmZmIalejd00sdLel+BoNVFudVv8A+Vapdp4nt5FURzTEx400xxTH0c+cgkmIiI4iOIgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABl/wClrsuNj9ddewLFqLeDn1xqWHERxEW70zMxHupri5THupagKnfZG9mxm7P0LfGNa5vaZkzhZUx4+pu99Ez7qa6eP+8BRgAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNvoi9Hq+qO/YytVsVTtjR6qbuoVTzEZFfjRYifzuOauPCmJ8JmEW7E2trG9d26dtfQcf1+oahei3aiZ4ppjxqrqnyppiJqmfZEtUekmw9H6b7D0/aejU82sajtX7808VZN6fw7tXvmfLyiIjwiAeqtUUWrdNu3RTRRREU000xxFMR4REP0AAAAAAAAAAAAAAAAAAAAAD8ZF6zj2LmRkXbdmzbpmqu5XVFNNNMeMzM90QhbrZ6SmwOnHrtOx8mNxa/RzT8AwbkTTaq9l27300d8d9MdqqPyfNSDrJ1x3/ANUb9drXNUnF0jtc29KwubePT393ajnm5MceNczxPhx4Atl1s9Lnae1/X6TsSzb3Nq9PNM5U1TGDZq9vajvu8eynimfyvJSzqV1G3l1F1f7Zbt1vIz6qZmbNjns2LET5W7cfJp+nxnzmXkwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFp/QB6V/b/dd7qNrGP2tN0S56rTqa47ruXMczX74t0zE/pVUzH4Mr4qE+jb6U1jYW3NP2XujbduvRMSJosZum09m9b7VU1TNy3VPFyZqqmZqiaZ91Urq7C3ttXfei06vtPW8TVcSeO3Nqr5dqZ8KblE8VUVe6qIkHoQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHkes+06N89K9x7Vqpiq5n4NdNjmO6L1Py7U/quU0T+p64BjRXTVRXNFdM01UzxMTHExL+JQ9Knav3Idet0abbt9jFyMr4fjceHq78es4j3U1VVU/wBFF4AAAAAAAAAAAAAAAAAAAAAAAAAAALH+hH0a+7ndv3Z6/idrbmi3om1Rcp5pzMqOJpo99FHdVV7Z7Md8TPAT56EnRqdh7S+7DcGJ2Nya3ZiaLdyn5WHizxVTR7qq+6qqPLimO6YlY0AAAAAAAAAAAAAAAAAAAB5nqFv3aOwNHnVd265i6ZYnn1dNdXN29MeVu3HNVc/RE8eamPWv0v8Acm4Yv6T08xru3dNq5pnPu8VZt2PdxzTa/VNVXnFUAth1f6z7C6X4lX3R6tTc1GaO1a0zE4uZVznwns88URP5VUxH0qRdbPSe371B9fpul3Z2xoNfNPwXDuz669T/ANbe7pnz+TT2Y4niYnxQdm5WTm5d3MzMi9k5N6ua7t67XNddyqZ5mqqqe+Zn2y+IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADudn7o3Ds/W7WtbZ1fL0rPtfg3sevjmPyao8KqZ86ZiYn2OmAXo6Del7pWszY0Pqbbs6RnzxRRq1mmYxbs90R62nxtT+dHNPj+DC1mNfs5OPbyMa9bvWbtMV27luqKqa6Z74mJjumJ9rGtMHQPr/ALx6VZdrDt3atX23NfN7Ssi5PFETPfVZq7/V1ftpnmeY574DTgeN6TdS9pdTtuRrO1tQi9FHEZOLc4pyMWufxblHPd4TxMcxPE8TPD2QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKV/ZJtr9jUdq7zs2+69au6Zk18d0TTPrLUfr7V7/dU7aX+mvtv7o/R512q3b7eRpVVrUrPd4erq4rn/wCHVcZoAAAAAAAAAAAAAAAAAAAAAAAAAA/dm3cvXaLVq3VcuV1RTRRTHM1TPdERHnIPV9Idg6x1K37p+1NGjs15FXbyMiaeacaxEx27tXuiJ7o7uZmI82qGxdr6PsvaWnbY0HH9Rp+n2YtWqZ/Cq86q6p86qpmapnzmZRd6I/R630t2FGTqlij7p9XoovahXMczYp45ox4n83n5XHjVM+MRSmsAAAAAAAAAAAAAAAAAfjIvWcexcyMi7bs2bdM1V3K6oppppjxmZnuiFaetnpc7T2v6/SdiWbe5tXp5pnKmqYwbNXt7Ud93j2U8Uz+V5AsTuHW9H27pF/V9d1PE0zAsRzdyMq7Fuin2RzPnPhEeM+SpHWv0yLVuL+kdLMKLtXE0zrOdamKY99qzPj7pr/3ZVa6ldRt5dRdX+2W7dbyM+qmZmzY57NixE+Vu3Hyafp8Z85l5MHa7p3Fru6dZvaxuLVszVM+9PNd/JuzXVx7I58KY8ojiI8odUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO/2DvHcexdyY+4dr6ne0/Ps93aon5NyjmJmiunwrpniOYn2RPjENE/Rv6+7f6s6dTgZEWdK3TYt85OnzX8m9ER33LEz31U+c0+NPnzHFU5muXo2p6ho2q4uq6VmXsLOxLsXbF+zXNNduuJ5iYmAbGiv3ooekHhdTdOt7a3Lds4m8Ma33x3U0ahRTHfctx4RXEd9VEfpR3cxTYEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHB3DpeNrmgajouZHONqGLdxb0ceNFyiaav7Jlj/q2Bk6XquXpmZR6vJxL9di9T+TXRVNNUftiWxzL70udA+530h9241Fvs2srKjPtz5Vevopu1TH9OquP1AigAAAAAAAAAAAAAAAAAAAAAAABbP0DOjX241WnqhuPE7WnYNyadGtXI7r2RTPfe486aPCPz+Z/E74R9HvphqHVbqLi6BY9ZZ06zxkanlUx/M2ImOeJ8O3V+DTHtnnwiWo2g6Vp+haLhaNpOLbxMDCsUWMezR4UUUxxEfsjxBzQAAAAAAAAAAAAAAR11g60bC6XYlX3Q6tTd1KaO1a0vE4uZVzmOY5p5+RE/lVzEeznwBIqE+tfpK9P+nMXtPxsmNxa9RzHwHBuRNFqr/rbvfTR4d8R2qo/J81SOtfpO7+6g+v03TL1W2dBr5p+CYV2fXXqf+tvd0z+jT2aeO6YnxQUCTesnXHf/AFRv12tc1ScXSO1zb0rC5t49Pf3dqOebkxx41zPE+HHgjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcnTM7N0zUcfUdOyr2JmY1ym7Yv2a5prt10zzFVMx3xMS0Y9E7rxi9UtBjRNcu2sfd+Baicijuppzbcd3rrce3w7VMeEzzHdPEZvOz2tr2rbX3Fg7g0LNuYWpYN2LuPetz301R5T7YmOYmJ7piZie6QbCiNPR16s6X1a2Lb1exFvG1fF7NnVMKmr+Zu8fhUx49iriZpn6Y8YlJYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACif2SPQ4xeoe2dw008RqGmV41Xd41WLnMz9PF6mP1QvYq/wDZG9F+F9J9E1uimarmnavFuru/Bt3bdcTPP6VFEfrBQcAAAAAAAAAAAAAAAAAAAAABytJ0/N1bVMXS9NxrmVm5d6mxj2bcc1XK6piKaY98zMOKux6BPRqcPFo6q7jxOMi/RVRodm5T30W57qsjjymqOaafzZqnwqpkE5ejZ0qw+k/TqxpHFu7rOX2cjVsmnv7d7j8CmfyKPwY/XPd2pScAAAAAAAAAAAAOv3Hrmjbc0i9q+vapiaZgWI5uZGTdi3RT7uZ8ZnyjxnyB2DzPUTf20en+jTqu7dbxtNsTz6qiue1dvTH4tuiOaqp+iO7z4Vd62emRbo9fpHSzC9ZV30zrOda7o99qzPj9NyP6Mqh7o3Drm6NZvaxuLVszVNQvfh38m7NdXHlEc+FMc90R3R5Asd1s9L7c24vX6T09xrm3NMq5pnOuTFWbdj2xxzTa/V2qvZVCsWZk5OZlXcvMyLuRkXq5ru3btc1111T3zMzPfMz7ZfIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB7rod1J1jpZv7E3Lpk1XbHPqs/E7XFOVYmY7VE+ye7mmfKYjy5idSdobh0ndm2NP3HoeVTladqFmL1i5HsnxiY8qomJiY8piYY+LQ+gh1fq2xumOnevZfZ0bWbv/o+u5PdjZk8RFPupud0fpdn8qqQX3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARH6YmkRrPo5bssxTzcxrFvMonv+T6q7RXVP8AuxVH60uOh6i6V9ven+4tE7PbnUNKycWKfb6y1VT/APUGQoAAAAAAAAAAAAAAAAAAAAO12ht7Vt17m0/bmh4tWVqOoX6bNi3HtnxmZ8qYjmZnyiJnyBJnoqdIb/VbqDRRm2rlO29Lmm/ql6O7txz8ixE/lV8T9FMVT48c6ZYmPYxMWziYtm3Yx7NFNu1at0xTTRTTHEUxEd0RERxw8f0U6d6T0v6fYO1tL7N2u3Hrc3K7PFWVkVRHbuT7u6IiPKmIjv45e1AAAAAAAAAAAfjIvWcexcyMi7bs2bdM1V3K6oppppjxmZnuiEKda/SW2B059fp2LkRuPX6ImPgODciaLVXsu3e+mj3xHaqjzpUh6x9b9/dUciu3ruqTjaT2+1a0vDmbePT393ajnm5Me2qZ93ALY9a/S72ptj1+lbCs2tzarTzT8LmqYwbU+3tR33fop4j87yUt6k9Rd49RNYnU9263kZ9cTPqbPPZs2Inyt24+TT9PHM+cy8oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP1brrt3KbluqqiumYmmqmeJiY84fkBp16J/VOnqh0ux8nOvxVr+ldnE1WmZjtV1xHyL3EeVymOfCPlRXEeCXmYPopdS56adW8HOzMmbWiajxhapEz8mm3VPybs/oVcVc+PZ7UR4tPaZiqmKqZiYmOYmPMH9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkBvjTY0Xeuu6PFHYjB1HIxuz7Oxcqp48vY6ZJHpP4Eab6QW9seKez29VuZHHd/neLnPd+mjcAAAAAAAAAAAAAAAAAABf30GejX3I7Zjf+4cTs67rFiPgVq5T8rExau+J91dzumfOKeI7uaoQH6GHRv+UXen3Ra7idva+i3Yqu01x8nLyPGiz76Y7qq/dxH4zReIiI4iOIgAAAAAAAAAeZ6ib+2j0/0adV3breNptiefVUVz2rt6Y/Ft0RzVVP0R3efCl/Wz0vtzbi9fpPT3Gubc0yrmmc65MVZt2PbHHNNr9Xaq9lUAtj1g60bC6XYlX3Q6tTd1KaO1a0vE4uZVzmOY5p5+RE/lVzEeznwUh61+k7v7qD6/TdMvVbZ0Gvmn4JhXZ9dep/6293TP6NPZp47pifFB+Zk5OZlXcvMyLuRkXq5ru3btc1111T3zMzPfMz7ZfIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABpR6FnUWd+dHMXDzb8XNY2/NOn5UTPyq7cR95uT9NEdnnzmiqWa6dPQi35Vs3rbg6fk3uxpm4YjTsiJnui7VPNir6e3xT7ouVA0kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmx6dGD8E9JLXr0RxGZj4l/xj/R6KP/ADoQcsl9kTxIx+umBfjwydAsXJmKeO+L1+jjnznimP2wraAAAAAAAAAAAAAAAAA9N0w2VrHULfGnbU0O32srNucVXJjmixbjvruVfm0xzPv7ojvmHmqYmqqKaYmZmeIiPNo/6HHRyOmmx/tzrWPFO6Nat015UVR34lnxosRPlPhVV+dxHf2YkEr9Odn6NsPZem7V0Gz6vCwbXYiqfwrtc99dyqfOqqqZmfp7u7h6EAAAAAB+Mi9Zx7FzIyLtuzZt0zVXcrqimmmmPGZme6IVn61+l3tTbHr9K2FZtbm1Wnmn4XNUxg2p9vajvu/RTxH53kCxe49c0bbmkXtX17VMTTMCxHNzIybsW6KfdzPjM+UeM+So/Wz0yLdHr9I6WYXrKu+mdZzrXdHvtWZ8fpuR/RlVrqT1F3j1E1idT3breRn1xM+ps89mzYifK3bj5NP08cz5zLygO03RuHXN0aze1jcWrZmqahe/Dv5N2a6uPKI58KY57ojujydWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD92Lt3Hv279i5Vbu26ororpniaaonmJifKeX4Aa09GN4W9+9Ldv7soqpm5n4dM5MUxxFN+n5F2mPdFdNUfQ9eqR9jf3dOXtjcWyci7zXgZFGfiU1T3+rux2bkR7qaqKZ+m4tuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACin2SaxFPUTa2T2p5uaTXRMezs3qp/8A+v7FUlxPsmFmunUti5E8diuznUR7eaZsTP8A80KdgAAAAAAAAAAAAAAA930K6bap1T6hYW2cDt2saZ9dqGXFPMY2PEx2q/pnmKaY86pjy5mAmr0E+jU7l3BT1I3Dic6NpV7jTbVynuysqn8fjzptzxPPnXx+TVC+brdraFpW2du4G39ExKMTTsCzTZx7VHhTTHt9sz3zMz3zMzM+LsgAAAR11g60bC6XYlX3Q6tTd1KaO1a0vE4uZVzmOY5p5+RE/lVzEeznwBIqEetfpLbA6c+v07FyI3Hr9ETHwHBuRNFqr2XbvfTR74jtVR50qlda/Sd391B9fpumXqts6DXzT8Ewrs+uvU/9be7pn9Gns08d0xPigoEmdY+t+/uqORXb13VJxtJ7fataXhzNvHp7+7tRzzcmPbVM+7hGYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmf0Lt0Ttj0hNB7dzsY2r9vS7/f+F62I9XH/wAWm00xY5aLqGTpGsYWq4dfYycLIt5Fmr2V0VRVTP7Yhr/t/U8fW9B0/WcSecbPxbWVZn8y5RFVP9kwDnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApx9kysVVYmwsmJjs27moUTHnzVGPMf/LKly7P2S7/7D2R/7zmf/LaUmAAAAAAAAAAAAAAB9sHFyc7NsYWFYuZGTkXKbVmzbpmqu5XVPFNNMR3zMzMRENOfRd6SY3Sfp7aw8ii3c3BqMU5GrX6e/wCXx8m1TP5NETMe+Zqnz4iCfQI6NduunqtuPEjs0zVb0Kzcp8Z76a8nj9tNPv7U+VMrngA6/ceuaNtzSL2r69qmJpmBYjm5kZN2LdFPu5nxmfKPGfIHYPM9RN/bR6f6NOq7t1vG02xPPqqK57V29Mfi26I5qqn6I7vPhV3rZ6ZFuj1+kdLML1lXfTOs51ruj32rM+P03I/oyqHujcOubo1m9rG4tWzNU1C9+Hfybs11ceURz4Uxz3RHdHkCx3Wz0vtzbi9fpPT3Gubc0yrmmc65MVZt2PbHHNNr9Xaq9lUKxZmTk5mVdy8zIu5GRermu7du1zXXXVPfMzM98zPtl8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABp36Heuzr3o67VvV19q9h2K8G5H5PqblVFEf7kUT+tmIvf9jd1icnptuTQqquZwdVpyIjzim9aiIj6ObNX7ZBakAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFQPsl3/ANh7I/8Aecz/AOW0pMuz9ku/+w9kf+85n/y2lJgAAAAAAAAAAAAEq+jH0ny+rHUSzp92i5RoOBNORq2RTzHFrnut0z+XXMTEeyO1P4qOtt6NqW4tfwdC0fFry9Qz79NjHs0eNVdU8R9Eecz4RHMy1J6CdNNN6V9O8PbeHNN7Mq+/6jlRHfkZFUR2p/RjiKaY9kR58zIe407CxNO0/H0/Ax7eNiY1qmzYs26ezTbopjimmI8oiIiH0yL1nHsXMjIu27Nm3TNVdyuqKaaaY8ZmZ7ohCnWv0ltgdOfX6di5Ebj1+iJj4Dg3Imi1V7Lt3vpo98R2qo86VIesfW/f3VHIrt67qk42k9vtWtLw5m3j09/d2o55uTHtqmfdwC2PWv0u9qbY9fpWwrNrc2q080/C5qmMG1Pt7Ud936KeI/O8lLepPUXePUTWJ1Pdut5GfXEz6mzz2bNiJ8rduPk0/TxzPnMvKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC2P2NfVPVb73ZovbmPhWmWsrs8+PqrvZ5//O/tVOWA9APPnD9IbFx4nj4dpmVYn38Uxc//AEYNGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU0+yaVVRR0/oiqezM6lMxz3TMfBeP8Azn9qmS3f2Sy9RVuXZePHPbow8qufZxVXbiP/AJZVEAAAAAAAAAAAABaj0cK9hdDtsz1L6h5lNe59Ux//AELo1iIuZVvGqjmLs0/5ubkeFVU0x2PCZ7Uw8Z1r9J3f3UH1+m6Zeq2zoNfNPwTCuz669T/1t7umf0aezTx3TE+KDb967fvV3r92u7drnmquuqaqqp9szPi/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACWvQ8y4wvSS2demqKe1kXrXMxz/ADmPdo4/8SJUg+jdfnG6+bHuRci3zrWNb5mY7+1XFPH6+eP1g1XAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQz7JFldvqtt3B7Uz6rQ4u9njujt37sc/+D+xVpYf7IJmxlekBNiK+18D0jGszHa57PM13OOPL8Pnj38+avAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2fQn/779h//AMSad/8AzNt4x7LoXz/LbsTs8c/dJp/HP/vNsGswAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMyPTPz41D0lN2V01dqizXj2Ke/wAOxjWqao/3oqQ89t161L7bdbN6Z8Vdqi5rmXTbnnnmim7VTT/4Yh4kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB7PoT/APffsP8A/iTTv/5m28YkX0Z7FeR1/wBkW6JpiY1ixX3+ymrtT/ZANUwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHyzci1h4d/Lv1dm1Zt1XK59lNMcz/wCT6vEdfNW+0fRPeepxc9Xct6Nk02queOLlduaKJ/3qoBlNqeXcz9Ryc69/O5N6u7X9NUzM/wDm44AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJh9DHCnN9JXaVHHNNq5kXqp7PMR2Ma7VH9sRHPtmEPLFfY99N+G9fK8uaeY0/R8i/zMeEzVbtft++T/AGg0OAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQN6eWs/av0dtSxYr7FWq52Nh0z2uJniv10xHt7rM93s5Typ79kr1uKNJ2dtyiuJm9fyM67T5x2KaaKJ/X6y5+wFKQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/saelTc13eeuVU8RYxsbEon2+sqrrq/4dP7YVAaB/Y7dFqwOi2fq1yiYr1TWLtVE+U27dFFEf8Aii4CyoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO37IBr0at18r02ivmjRtMx8WYie7t1dq9M/Txdpj9TRJkr1o3D91fVndO4aa+3azdUv12J/6mK5ptx/uRTAPIgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANVfRq2/O2Og+ztJro7FyNNoybtPnTXe5vVRPvibkx+pmV0429c3Zv8A0DbNumqZ1PULONVNP4tFVcRVV9EU8z+prtat0WbVFq1RTRbopimmmmOIiI8IgH6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4/rZuONpdJN07hivsXcPTL02J54+/VU9m3/AOOqlku0A+yIbn+1XSDT9uWrkU3tc1GmK6efwrNmPWVfsrmyz/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABY/wCx87Uq1rrTe3DdtdrG0DAruxXxzEX7vNqiP92bs/0WhKvXoD7OnbnROnXMiz2MzcWVVlzNVPFXqKPvdqPo7q6491xYUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHyzcmxhYd/MyrtNrHsW6rt2urwpppjmZn6IgGfn2QfdX2560WNv2bnax9AwKLVVMTzxeu/fK5/3ZtR/RVvd/1F3Hf3fvzXdz5E1dvU8+7kxTV+JTVVM00/RTTxH6nQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO96f7azd5b20ba2nxPwjU8u3j01cc9iKp+VXPupp5qn3RLolu/sdPT+cvXdW6j59j7zg0zgadNVPjeriJu1x+jRMU/wDeVewF0dC0vD0TRMHRtOtRZwsDGt42Pbj8W3RTFNMfsiHMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDPpn7vnaXQHW/U3fV5msTTpWP398+t59Z/+VTc/sTMoj9kX3nOpb+0fZONd5x9GxfhOTTE/wCfvcTET9FummY/9pIKqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5uh6Xn63rOFo+l49eTnZ1+jHx7VHjXcrmKaY/bLWDpFsrC6edOdG2jgzTXGBjxF67EceuvVT2rlz9dc1THsjiPJUz7Hv0uqztYyeqGr4/8Ak2DNWLpEVR+HemOLt36KaZ7MT7aqvOld4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHH1PNxdM03K1LOvU2MTEs1379yrwooppmqqqfdERMskOpO6Mrem/tb3VmdqLup5tzIiiZ/m6Jn5FH0U09mn9S+3p4b4+5Xotd0TGvdjP3Je+BURE/KixTxVeq+jjs0T/7RnQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9X0l2NqvUbf2mbS0ini7mXPv16Y5px7NPfcuVe6Kee7zniPGYeVopqrriiimaqqp4iIjmZlpB6HXRuOmeyPtvrWNFO6dZt015cVR8rEs+NFj3T+NV+d3d/ZiQTDs3bul7S2rpu2tFseo0/TsemxYo85iPGqZ86pnmZnzmZl2wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8N153zZ6ddKdc3TVXRGVYsTawaKvx8mv5NuOPOIqntTH5NMgor6b++43j1tzdPxb3rNO29R9rrMRPdN2meb1X09vmn6LcIKfu/du5F+5fv3Krl25VNdddU8zVVM8zMz5zy/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJ39E3oTl9Udw061rli9Y2hp92PhFzvpnNuR3+oon2flVR4R3eMxMBIPoL9DqtTz7HVDdWH/kGNXzomNdp/n7sT/wCsTE/i0zz2fbVHP4sc3gfLCxcbCw7GHh2LWPjWLdNqzZtURTRbopjimmmI7oiIiIiIfUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABRX7Ih1CjVd3ab08wL/axdHpjLz4pnuqyblPyKZ/Qtzz/wB7PsXK6kbr07Y+xdY3XqlURjabjVXpp54m5X4UW499VU00x75ZMbm1rUdx7h1DX9Wvzfz9Qya8nIue2uuqZniPKO/ujyjiAdcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACbfRm6A611X1OnU9Q9fpm08e59/zezxVkzE99qzz4z4xNXfFPvnuBxfRl6Hat1b3JF7KpyMDa2HXznZ8UcesmOPvFqZ7prmJ7574pjvnvmmKtI9saFpG2dAw9B0HAs4Gm4VuLdixajimmP/OZmeZmZ75mZmeZk2xoWkbZ0DD0HQcCzgabhW4t2LFqOKaY/wDOZmeZmZ75mZmeZl2QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPOdTN36bsPYer7t1WecbTsebnq4nibtc91FuJ9tVU00x9IKlfZEepPwnU9O6ZaZkfesTs52q9mfG7VH3q3P0UzNcx+fR7FP3abs13Udz7m1LcWr3vXZ+o5NeTfq8u1VPPEeyI8IjyiIh1YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7PbGgazufW8bRNv6bk6lqOTV2bWPYo7VVXv90R4zM8REd8rz+jh6K2kbRnG3L1Box9Y16ni5ZwOO3i4VXlM+V25Htn5MT4RMxFQIl9GL0XtQ3fVjbr6g2L+nbens3MfAmZov58eMTV527U+3uqqjw4jipe/S9PwdK07H03TcSxh4eNbi3YsWaIoot0x4RTEd0Q5IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAop9kF6nxrO58XptpV/tYWj1RkalVTPdcyqqfk0e+KKKv96uY8aVrPSA6jYfS7pjqO5r00V5vHwfTrFU/wA9k1xPYj3xHE1z+bTLK7U83L1LUcnUc+/XkZeVerv371c81XLlUzVVVPvmZmQccAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHv+lHR7f/UzKpp2xod2rB7fZu6jkfesW37ea5/CmPyae1V7geATZ0J9G/e/UyqzqeTbq2/tyrir7YZVqe1fp/6m33TX+lMxT75mOFqOifoq7H2PNnVNyRRurXKOKoqybURi2KvzLU89qY/Kr58ImIpWEiIiOIjiIB4jpH0r2Z0v0X7X7X0ym3euUxGTnXuK8nJn8+vjw/NjimPKHtwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABXf04OrcbF2DO09HyuxuHcFqq3zRVxXjYk803Lnumrvop8PxpieaQVh9Mnqv/KR1KrwNLyfWbd0Ka8bC7E8037nP32/74qmIimfyaYnzlBoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD1Ox+nm+N734tbV2vqmqxM9mb1mxMWaZ/Ou1cUU/rmFhunXoWboz5t5O+dw4ei2J4mrEwY+E35jzpmqeKKJ98dsFUEqdLOgHU7qHNrI0vQa9P0y5ETGo6lzYsTTPhNPMdq5Hvopqj6F8umnQDpZsGbV/Stt2s7ULffGfqfGTfifbTzHZon30U0pSBXHpL6I2wNqzZz913K926lRMVdi/R6vDon3Wome3/TmYn8mFicTHx8TGt4uJYtY9i1TFFu1aoimiimPCIiO6I9z6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOj35unSNlbQ1LdGu3/U4Gn2Zu3Jj8KufCmimPOqqqYpiPbMMquqe9dW6hb71Pdms1z6/NuzNu1FXNNi1HdRap91NPEe/vme+ZTb6cfWKN6btjZGgZfb2/ol6fX3LdXycvLjmKp99NHfTHtmap744VrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9LFm9kXYtWLVy7cnwpopmqZ/VAPmO4w9q7nzIonD25rGRFc8U+qwrlfan2RxT3u5welfU7N4+C9O92XaZns9qNHv9nn31djiAeOEn4Ho/dZs2Imz0+1enmOfv0UWfPj8eqO/wBz0eneih1uyp+/7aw8Hvn+f1THn/5K6gQaLPaR6FXUe/MValuLbGFRPlbu3r1cfq9XEf2vb6H6DuDR2atb6hZF78q3h6bTb4+iqqurn/dBSoaJbe9D3pBpvZnPo13Wqo4mqMvP7FMz591mmiYj9f60j7b6LdKNuzRVpewNBpuW/wAC7fxYyLlPviu72qo/aDLvb+29xbiv+o0DQdU1a7zx2MLEuXp5+iiJSvtL0Wus24OxXXtyzo1iue67qeVRa4+mintXI/3WlOPZs49mmzj2rdm1RHFNFFMU00x7ojwfsFONmehDYiaLu8t73K4/Hx9Jxop4+i7c5/4acNj+jt0h2lNu7h7QxdQyqP8A9o1OZyqpn29mvmiJ/RphK4D8WbVqzZos2bdFu3REU0UUUxFNMR4RER4Q/YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK8+mn1njp9tD7ltAyuzufWbUxFdFXFWFjTzFV33VVd9NP8ASq/FjmVOsvUPRumOw83dOs1RX6qPV4mNFXFeVfmJ7Fun6eOZnyiJnyZa773TrO9d26jufX8n4RqGfdm5cmO6miPCmimPKmmOIiPZAOjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAc3QdKz9d1vC0bSsavJz86/Rj49mjxrrqmIpj9suEuL9j26WevycnqnrONzbszXiaLTXT41+F2/H0RzbifbNz2QD6WPQZu1WLc3+p1FF2aYmumjQ5qppq474iZvxzHPnxH0Q/fxGP9qP1B/wAwuYApn8Rj/aj9Qf8AMHxGP9qP1B/zC5gCmfxGP9qP1B/zB8Rj/aj9Qf8AMLmAKZ/EY/2o/UH/ADB8Rj/aj9Qf8wuYApn8Rj/aj9Qf8wfEY/2o/UH/ADC5gCmfxGP9qP1B/wAwfEY/2o/UH/MLmAKZ/EY/2o/UH/MHxGP9qP1B/wAwuYApn8Rj/aj9Qf8AMHxGP9qP1B/zC5gCmfxGP9qP1B/zB8Rj/aj9Qf8AMLmAKZ/EY/2o/UH/ADB8Rj/aj9Qf8wuYApn8Rj/aj9Qf8wfEY/2o/UH/ADC5gCmfxGP9qP1B/wAwfEY/2o/UH/MLmAKZ/EY/2o/UH/MHxGP9qP1B/wAwuYApn8Rj/aj9Qf8AMHxGP9qP1B/zC5gCmfxGP9qP1B/zCqfUbQ9L21vbVdA0bXft7h4F+cenPjHizTeqp7q5ppiuv5MVcxE9qeYjnzaD+mV1Ujp10wu4Gm5Pq9wa7FeLhdmflWbfH3297uImIifyqonylmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAtx6MXou6FvbpzRuzflzVsarUbnb02xi3qbX+Tx3Rcq7VMzPbnmY8PkxE9/aQf6OHTTI6pdUMDb803KdLs/5Vql6nu7GPTMcxE+VVUzFEeyaufKWpeFjY+Fh2MPDsW8fGsW6bVm1bpimm3RTHFNMRHhERERwCv+N6HvR6zFUXKNfyOfCbmoRHH0dmmH2+KH0a/0LWf6xq/uT+Agu36J3ROmimmrb2dXMRETVVqd/mffPFXD743oqdDrVc1XNp378THHZuaplREe/wCTchNoCG7fovdCqLlNdOxaZmmYmO1qmZMfrib3EuX8W7ol8wcL95v/AMRLICMo6A9Gojj+T3Rv9yr+9zaeifSOmmKY6c7Z4iOO/Aon/wCiQAHjbXSnpdarprt9N9nU1UTE01RomNzEx4Tz2HYY+xNj49z1mPs3btmvjjtUaZZpn9sUvRAOtxtA0LGomjG0XTbNMzzMW8WimJn9UOxoppooiiimKaaY4iIjiIh/QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABxdX1HB0jSsrVdTyrWJg4dmq/kX7s8U26KY5qqmfZEQ5ShXpt9dY3bqd3p5tPNmrQMG7/AOkcm1V8nOv0z+BE+duiY+iqqOfCmmZCNPSb6v53VrfVWXbm5Y2/p81WdKxau7iiZ77tUfl18RM+yIpjy5mJwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6vpLsjU+ovUDStpaXE03My7Hrr3HMWLMd9y5P6NPM8ec8R5tW9raHpu2duaft/R8eMfT9Px6MfHt+PFNMcRzPnM+Mz5zMyr76B/SuNpbCq3vq2N2dZ3DbiqxFdPFVjD8aI+mueK593Y9krKAAAAAAAAAAAAAAAAAAAAAAAAAAAPhqOZi6dp+RqGdkW8bExrVV6/euVcU26KYmaqpnyiIiZfdU/7IF1U+1G3sfpno2VxnapRF/VaqKu+3jRPyLc+ya6o5n82nv7qgVZ9IXqRl9Uep2o7kuTco0+mfg2mWK/81jUTPY5jyqq5muffVMeEQj0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAH9iJmeIjmZfxYL0Ielf3d9Sadxari+s0Db1dN+5FdPNN/J8bVv3xEx26vdTET+EC1nofdLI6a9L7N7Ucb1e4NbijL1DtU8VWqePvdmf0YmZmPyqqk1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/S368Y3THQqtv7fvW7279Qtfeo/CjAtVRMeuqjwmr8mmfPvnujioPGem116jb+FkdNtn5v/pjJo7GrZlqqecS1VH8zTMf5yqJ75/Fp7vGeaaLPrmZORmZd7My79zIyL9yq5du3KpqruV1TzVVVM98zMzMzL5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJa9FXpfX1Q6p4mDl2KqtC03jM1Wvv4qtxPybXPtuVfJ9vZ7Ux4Ios27l67RatW6rlyuqKaKKY5mqZ7oiI85afeix0vt9LulmJp+VZpjXNQ4zNVr474u1R8m1z7KKeKfZz2pjxBKtqii1bpt26KaKKIimmmmOIpiPCIh+gAAAAAAAAAAAAAAAAAAAAAAAAAAB0HUTdmlbG2Vqu69ZudjD06xN2qnniblXhRbp/OqqmKY98sot+bo1Tem8dU3RrN31mdqORVeud/dRHhTRT+bTTEUx7ohYz0/uqn2+3VZ6caPkxVp2jVxd1Gqiruu5cx3Ue+LdM8fpVVRPfTCq4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOZommZ+t6zh6PpeNXlZ2bfox8ezR43LlcxFMR9My1W6H9PsDpl020zamHNFy9Zo9bm5FNPHwjJq4m5X9HPERz3xTTTHkq99j46VxlZ2R1S1jG5s4014ujU1x+Fc44u3o+iJ7ET7Zr84XXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFnpFdaNC6RbY9ff9Xna/l0TGnadFXfXPh6y5x3024nxnxme6POYDhek31u0vpHtjsY82M3c+dRMafg1Vd1Ed8euuRHfFET4R3TVPdHhMxmtuHWNT3BreZrWtZt7O1DMuzdyL92rmquqf8A6eUR4REREORvHcmtbu3Lm7i3BnXM3Uc25Ny9drn9lMR5UxHEREd0REQ6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHZ7U0LU9z7l07b2jY85GoahkUY9ijymqqeOZnyiPGZ8oiZBYT0Delf3Wb6r3zq+NNWj7fuRONFVPyb+ZxzTHvi3HFc++aPe0BeW6T7J0vp3sDStpaVTTNrCsxF292eJyL099y7V76qpmePKOI8Ih6kAAAAAAAAAAAAAAAAAAAAAAAAAABG/pH9SrHS3pdqGv01UTql6Pgul2quJ7eRXE9mqY86aYia59sU8ecJImYiOZniIZoemB1U/lL6oXrem5HrNv6LNWJp3Zq5pvTz98vx+nMRxP5NNPvBDmblZGbmX8zMv3MjJv3Krt67cqmqq5XVPNVUzPjMzMzy+IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPUdKdlan1C39pW0tKpmL2deiLl3s8xYtR33LlXuppiZ988R4y8u0A9AvpX9yuxa996tj9nWNw2o+DRVHfYwueaf13JiK590UeHeCwm09B0za22dO27o2PFjT9Ox6MexR59mmOOZnzqnxmfOZmXaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACGPSX686J0m0erBxJs6juzJtdrEwJmZpsxPhdvceFMeVPMTV5cRzVAdj6RPWzb/SPb01XqreduLKtzOn6ZFXfV5esucfg24nz8auJiPOYzY3vurXd6bnzNx7jz7mdqOXX2rlyrwpjyppjwppiO6IjuiHy3fuPWt27jzNw7hz7ufqWZc7d69cnx9kRHhFMRxERHdEREQ6kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABdb7Hx0rnGxMjqnrOPxdyIrxdGprp/Bt88Xb0fTPyIn2RX7VX+iHT/P6mdSdL2ph9u3avV+tzb9Mc/B8aniblf08d0e2qqmPNqtoWl4Gh6LhaNpeNRi4OFYosY9miO6iimIiI/ZAOYAAAAAAAAAAAAAAAAAAAAAAAAAADh63qeBouj5msapk0YuDhWK8jIvV+Fu3REzVVP0RAIJ9N/qpOxOm87c0nJ7GvbiorsUTRVxVj43HF257pnnsU+H4UzE/JZ0vbdcOoGf1N6k6nuvN7dFm9X6rCsVTz8HxqZn1dH08czPHjVVVPm8SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD9W6K7lym3bpqrrqmIpppjmZmfKASp6LfTCvqj1SxNNyrVc6JgcZeq1x3RNqme63z7a6uKfbx2p8moFm3bs2qLVq3Tbt0UxTRRTHEUxHhER5Qib0U+l9HS/pZi4WZZpp13U+MzVavOm5MfJtc+yinu9na7cx4pbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8rqpoomuuqKaaY5mZniIhT30ofSpoxvhWz+l2bFy/8AKtZmuWp5po8ppx585/6zwjj5PPdVAe69KP0kdN6dWMjbG07ljUd21U9m5V3V2dO5476/Kq5xPdR5eNXdxFWfmt6pqOt6tk6tq+bfzs/KuTdv5F+uaq7lU+MzMuNeuXL12u7duVXLldU1V11TzNUz3zMz5y/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJp9EDpZPUvqhZuajj+s29os05eo9qOabs8/e7Pv7dUd8fk01e4FrPQf6V/cL02jcuq43Y17cVFN+uK6flY+L42rfumee3V4fhUxMc0rBkRERxEcRAAAAAAAAAAAAAAAAAAAAAAAAAAAAp99kH6qfBsPH6WaNkzF7IijK1mqir8G342rM/TMRXMeyKPasx1X3tpnTzYGq7t1WYqtYNmZtWe1xN+7Pdbtx76qpiOfKOZ8IllJu3X9T3TubUdxazkTf1DUcivIv1+XaqnniI8qY8IjyiIgHVgAAAAAAAAAAAAAAAAAAAAAAAAAAAAALJ+gf0s+67f1W9tWx+1o23btNVmKqeab+ZxzRH9COK59/Y8pV+2voepbl3Hp+39Hx5yNQ1DIox8e3HnVVPEc+yI8ZnyiJlq10j2PpvTrp7pW0tMiKqMO19+vcd9+9V33Lk/TVM8eyOI8gesAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdZuncGibW0LK13cOp4+m6bi0du9kX6uKY9kR5zM+EUxzMz3REy8T1w6z7O6T6PN7Wsn4Xqt2jtYelY9cTfveyZ/Io58a59k8RVPczy619Xt39V9djO3BlRawbNUzhabYmYsY0T5xH41fHjXPfPujiICSPSX9JnWeofwjbW05yNH2tMzRdq57ORnx+fMfg0T+RHj+Nz4RXUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfXDxsjMy7OHiWbl/Iv3Kbdq1bp5qrrqniKYjzmZmIalejf00x+lvS/A0GqmirVb8fCtUvU8T28iqI5piY8aaI4oj9HnzlVf0Aelca/uu/1G1jG7Wm6Lc9Vp1Ncd13MmOZr98W6Zif0qqZj8GV8QAAAAAAAAAAAAAAAAAAAAAAAAAAARR6UvVC10u6W5eo412mNb1DnD0qjz9bMd9zj2UU/K9nPZjzBVb09Oqk7q31TsTScntaPt+5MZU0z8m9m8TFX/wAOJmiPfNfuVnfu9cuXrtd27cquXK6pqrrqnmapnvmZnzl+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAez6K7B1DqX1H0vaeBNVujIr7eXfiOfg+PT33Ln0xHdHPjVNMeYLP8A2PfpX6rHyOqms40dq7FeJotNdPhTz2bt+Ppnm3E+657YXGcLQNJ0/QtEwdF0rGpxsDBsUY+Pap8KLdERFMe/ujxc0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHhervVjZXS7SPhu6NUpoyLlMzjYFjivJyP0aOe6PzquKY9vPAPb3rtqxZrvXrlFq1bpmquuuqIpppiOZmZnwhVD0h/S207RvhO3OmFVnUtRjmi7rNURVjWJ8J9VTP87V+dPyPDjt+VfuvfpDbz6p3run+sq0Xbfa+RpmNcn77HPdN6vum5Ph3d1MceHPehoHN1zVtT1zVsjVtZz8nUM/Jr7d7IyLk1111e2ZlwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd3sPbGq703hpm19Fs+tztRv02bfPhTHjVXV7KaaYmqZ9kS6Ref7H50r+1O37/U3WMfjN1OmrH0qmuO+3jRPy7numuqOI/Np58KgWR6dbS0vYuydK2po1HZw9OsRapqmIiq7V413KuPxqqpmqffMvQAAAAAAAAAAAAAAAAAAAAAAAAAAAD+XK6LdFVy5VTRRTEzVVVPEREecswvSq6o19UeqWVm4d6qrQtN7WHpVPfEVW4n5V3j211d/t7PZifBav08Oqc7Q2DTsnScjsazuK3VTfmmflWMLwrn3TXPNEe7t+cQz6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaI+g30rjZHTr7qdVxuxru4qKbsxXTxVYxfG3R3+E1c9ufppifwVU/RF6WT1M6o2Pthjzc2/o805epzMfJud/3uz/Tqiefzaa/PhplTEU0xTTERERxER5A/oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP5VMU0zVVMRERzMz5A/rh61qmm6Lpd/VNYz8XT8HHp7d7IybsW7duPbNU90IH61+lVsbY/rtM21NG6tcomaJoxrnGLYqju+Xd74qn82jnwmJmlSPqv1W3x1O1OMvdesV3rFFU1WMGzHq8Wx+hb58fLtTzV7ZkFmuu3ph2rXr9E6VWIu3ImaK9byrXyY99m1V4/pVxx+bPdKnevaxquvatf1bW9RytRz8irtXsjJuzcuVz75n/9YcEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIXo99OMrqj1Q03bVEXKMCJ+E6leo8bWNRMduefKauYoj31Q1P07CxdO0/G0/Bx7ePiYtqmzYs244pt0UxFNNMR5REREIU9DPpX/Jz0wt5+p43q9wa9FGVmdqPlWbfH3qz7uImapj8qqY8oTkAAAAAAAAAAAAAAAAAAAAAAAAAAA63dOuabtnbmobg1jIjH0/T8evIyLnjxTTHM8R5zPhEeczEOyUt+yE9U/W5GP0r0fI+RamjL1qqirxq/CtWJ+iOLkx76PZIKy9XN8al1F6g6ru3U5mmvMu/ebPPMWLNPdbtx9FMR9M8z5vJgAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+uLj38rKtYuNZuXr96uLdq3bpmqquqZ4imIjxmZ7uHyWk9ATpX90O77vUTWMaatM0O52MCK6fk3szjnte+LcTE/pVUz5SC1Ho1dMrHSzpdg6Hcot1avk/5Xqt6nv7V+qI5pifOmiOKI9vEzxE1SkwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfyqYppmqqYiIjmZnyB/RBvVr0oemmxvW4eDmzujVqOYjF0yumq1RVHlcvfg09/d8ntTHnCnnVz0kOpfUOL+Fc1P7R6Nc5j7X6bM24qp9ly5+HX3eMcxTP5MAub1l9JLp306pvYVvMjcOuUTNP2v0+5FUW6vZdu99NHsmPlVR+SpX1m9IPqF1Nm9h5uf9qNDr+T9q8CqaLddP8A1tX4Vzy5iZ7Pd3UwiMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATz6FXSz+UHqbRrGqY/b0Db9VGTkRVTzTfv882rXvjmJqn3U8T+FCD9KwMzVdUxdM07HuZObl3qLGPZtxzVcuVTFNNMe+ZmIap9BOnWF0v6ZabtfH7FeXTT6/Ub9P+fya4jt1fRHEU0/m00+fIPeAAAAAAAAAAAAAAAAAAAAAAAAAAAA8Z1r39gdNOm+qbszuxXcx7fYw7FU/wDrGRV3W7ft4me+ePCmKp8mVGv6tqGu65na1quTVk5+dfryMi7V413K5map93fPgnn04+qcb36jfcvpWR29D27XXZiaZ+TfyvC7X74p47EfRVMd1SvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO52PtrVd47u0zbGiWfXZ+o5FNm1HlTz41VeymmImqZ8oiZau9NdoaVsPY+lbT0aiIxdPsRb7fZ4qvV+Ndyr86qqZqn6VbPsffSudM0TI6nazjcZeo0VY2k0V099vHifl3e/wA66o4ifyaZ8YrW1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfPKx7GVjXcbKs279i7RNFy1cpiqmumY4mJie6YmPJ9AEN769GXo/uv1l2dtRomVXz9/0i58H4+i3xNv/AMCAt++hPr2LFzI2TuvD1KiOZpxdRtzYu8eyK6e1TVP0xRC8IDJ3f/SfqLsSa6t0bS1LCx6PHKpt+tx//i0c0fqmeXiWy9URVTNNURMTHExPmi3qD6PvSfevrLuo7UxcHNr5n4Zpn+S3eZ/GnsfJrn31U1Ay6FuOonoU63iRdytibnx9StxMzTh6lR6m9EeURcp5pqn6YohXHfnTrfGxcmbO7Nsajpcc9mm9ctdqzXP5t2nmir9Ug8qAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD0nTLZ2qb+33pW0tIp/ynUL8UTcmOabNuO+u5V7qaYmZ+jgFlfsfPSydQ1jI6oaxj84uBNWNpFNcd1d+Y4uXfoppnsxPtqq8JpXfdPsrbml7Q2npm2dGs+pwNOx6bFmnzmI8ap9tUzzMz5zMu4AAAAAAAAAAAAAAAAAAAAAAAAAAAQ16XfVOOmXS6/9r8jsbg1ntYmmxE/Ktd33y/8A0KZjj86qjy5TDlX7GLjXcrJvW7NizRNy7cuVRTTRTEczVMz4REd/LLf0lept/ql1RztboruRpGN/kulWqu7s49MzxVMeVVczNU/TEeEQCNJmZnmZ5mX8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB7/AKA9Ocvqh1N07bNn1lvD59fqN+mP5nGomO3P0zzFMe+qHgGkXoX9K/5POmVGqari+q3Dr8U5OVFdPFdizx96s+7iJ7Ux49qqYn8GATbpeBh6XpmLpunY1vGw8SzRYx7NuOKbdumIimmI9kREQ5IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPll4+Pl41zGyrFq/YuU9m5bu0RVTXHsmJ7ph9QEGdSvRY6U7vi5k4OmXNsahVzMXtKmKLUz5dqzPNHH6MUz71YOpnoj9S9r+tytv04269Po74nD+95MR77NU98+6iqqWiQDG/UcHN03Nu4Oo4eRh5Vmrs3bF+3Nu5RPsmmYiYn6XHa47+6fbL35g/A927cwNVoiJii5do4u24n8i5TxXT+qYVb6p+hZExdzum+4OJ/CjTdVn+yi9TH7Iqp+mrzBTIem39sHeOw9R+Abu29naVdqmYt1XaObV3jx7Fynmiv8AozLzIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC+/oC9K425s251C1fG7Oq67b7GDFdPyrOHzzFX03JiKv0aaJjxlVf0ZumV7ql1RwdGvW6/tPiTGVqt2meOLFM/gRPlVXPFMecczPk1Gx7NrHx7ePj2qLVm1RFFuiiOKaaYjiIiPKIgH7AAAAAAAAAAAAAAAAAAAAAAAAAAB02+Ny6Xs7aOqbo1q96rA03Hqv3Zjjmrjwop58aqpmKYjzmYgFdPT86qRt/aNrp3pGT2dT1u36zUJpnvtYfPHZ903KomP0aavbChb0XUnd+qb83xqu7NYr5ytQvzc7Ha5i1R4UW6fdTTEUx9DzoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOTpmDl6nqWNpun49zJzMq7TZsWbcc1XK6piKaY98zMQCbPQw6V/yidTrep6pjRc2/oFVGVlxXTzTfu882rPsmJmO1VHh2aZifwoaRvAej/wBOcPpd0x07bNmKK83j4RqN+mP57JriO3PviOIoj82mHvwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcTWNL03WdNvabq+n4moYV+Ozdx8qzTdt1x7JpqiYlWvq16HWz9e9bn7Fz7m2c6rmr4Lc5vYdc+yIme3b7/OJqiPKlZ8BlH1S6Q9QOmt+Y3ToF+1h9vs28+x99xbns4uU91Mz5U1cVe54Nsnl4+Pl41zFy7FrIsXaZouWrtEVUV0z4xMT3THuVy6w+iLsfdPrtR2bd+5TVKuavU26O3hXJ99vxt+z5E8R+TIM+R7zqv0i350yzps7p0W5bxaquLOoY/N3Fu/RciO6fzaopq9zwYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+0xNVUU0xMzM8REeb+LFegx0r+7XqJO7NWxpr0PbtdN2mKqfk38vxt0e+Kfw5+iiJ7qgWs9EnpZHTHpdj28+xFGv6v2cvU5mOKrczHyLM/oRPE/nTUmIAAAAAAAAAAAAAAAAAAAAAAAAAAAFHPsgnVT7Z65j9MdGyYqw9OqpydWqoq7rmRMfItcx5UUzzMflVR50rSekB1Gw+l/TLUdzXpt15vHwfTrFU/z2TXE9iOPOI4mqfdTLK/U87L1PUsnUtQyLmTmZV2q9fvXJ5quV1TM1VT75mZkHGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW1+x99K/tnruR1O1nF5w9Oqqx9Jprp7rmRMcV3Yj2UUzxE/lVT50q2dNtoarvzfGlbT0ajnL1C/FuK5jmm1R413KvzaaYmqfoau7H21pezto6XtfRbPqsDTcemxaieOauPGurjxqqmZqmfOZmQdyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD452Ji5+Hdw87Gs5WNepmi7ZvW4rorpnxiqme6Y90qwdafQ+21r0XtU6d5VG3dRmO18AvTVXhXZ9099Vr9Xap8IimFpQGRvULYW7tgaxOlbt0PK0y/PPq6q47Vq9Eedu5HNNcfRPd5vMthN1bc0LdOjXtH3HpOJqmBej5djJtxXTz7Y9kx5THEx5Kc9cvQ7zMKL+tdLcmvNx45rr0bLuR66iPZauT3V/o1cT3fhVT3AqCOTqmn5+lahf07U8LIwc3Hr7F7HyLU27lur2VUz3xP0uMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADn7e0jUdwa7g6JpONXlZ+dfox8e1T4111TxEe6Pf5NWOjOw9P6bdOdK2lp/Yrqxrfayr9McfCMirvuXJ8++fDnwpimPJWL7Hv0rmqvI6qazjfJp7eJotNdPjP4N2/H9tuJ/T9kLnAAAAAAAAAAAAAAAAAAAAAAAAAAAAgr00Oqk9O+mVemaXk+r3Br8V4uJNFXFdi1x99ve6YiYppnx7VUTH4Mgql6aHVSOonU2vS9LyfWbf0Ca8XEmirmi/d5++3vfEzEU0z4dmmJj8KUEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAACTPRr6Z3+qXVHA0Oui5Gk48/CtVvU93Yx6ZjmmJ8qq54pj6ZnykFp/QD6V/c/tK71F1fH41PW7fq9Pprjvs4cTz2o9k3Koif0aaePGVpXzxbFjFxrWLjWbdmxZoi3at26YppopiOIpiI8IiO7h9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAR91i6PbH6pabNjcmmRTnUUdnH1LG4oybPs4q4+VT+bVEx7ue9Qvrv6PO9ulty7n1Wvt3t2J+RqeLbn73Hl66jvm3Pv5mnw+Vz3NNX5u0UXbdVu5RTXRXE01U1RzFUT4xMAxpF7vSB9EnR9wfCNf6afB9G1Sea7mlVT2cTInx+9z/map9n4Hh+D3ypJujb+t7X1vI0TcOmZWmajjVdm7j5FE01R7Jj2xPjExzEx3xMg6wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB67o/sXUeo/UPStpab2qJzLvORfinmMexT33Lk/RTzxHnPEebyLQn0E+lc7N6f1bx1fGm3re4qKa7dNdPFVjD8bdPumv8Ofd2POAT9tnRNN23t7T9A0fGpxtP0/Hox8e3T+LRTHEc+2Z8ZnzmZl2IAAAAAAAAAAAAAAAAAAAAAAAAAAA42qZ+HpemZWpajk28bDxLNd/IvXJ4pt26Ymaqpn2RETLK/r/1Fy+qHU7UtzXZrowu18H06xVP8zjUTPYj3TPM1T76pWk+yCdVPtZoeP0x0bJmnM1GmnI1aqirvt48T8i1zHnXVHMx+TTHlUo4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+xEzPERzMtMfRE6WfyZdLrP2xx4t7h1ns5epTP4Vvu+92f6FMzz+dVX38cKp+g50r+7jqPG6NVx+3oe3a6L0xVTzTfyvG1R74p47c/RTE/hNEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHhur/AEq2b1R0OdO3Pp0VX6KZjFz7PFOTjT+ZXx4e2meaZ9j3IDL/AK9dCN4dJs2rIzLX202/cr7OPq2PRPY7/Cm7T3+rr908xPlM9/ETtkNSwcLUsC/p+o4ljMw8iibd6xftxXbuUz3TTVTPdMT7JUr9JP0TsjTYyd09Lce9lYkc3MjQ4ma7tr2zYnxrp/Mnmr2TVzxAVDH6uUV27lVu5TVRXTMxVTVHExMeUvyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD92bV2/eos2bdd27cqimiiimZqqqmeIiIjxkEt+ih0ur6n9UsbGzLE16DpfZzNUqmPk10RPyLP011Rx+jFc+TTm3RRbopt26aaKKYiKaaY4iIjyhFvov9MLXS3pbh6VkWqI1vO4y9WuRxM+uqjut8+dNEcU+PEzFUx+ElMAAAAAAAAAAAAAAAAAAAAAAAAAAB53qTu/S9h7H1XdmsV8Yun2JudjnibtfhRbp/OqqmKY+l6JQv0/Oqn3Q7utdO9Hyu1pmiXO3qE0VfJu5nHHZn2xbiZj9KqqPIFdN8bl1XeO7tT3Prd712fqORVeuz5U8+FNPsppiIpiPKIiHTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5ug6Vn67reFo2lY1eTn51+jHx7NHjXXVMRTH7ZcJcb7Ht0sm7k5PVTWMf73a7eJotNceNXfTevR9Ec24n33PZALP9FNg4HTTpvpe08HsV3Me328y/TH/rGRV33Lnt4me6OfCmKY8nswAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABX30lvRr0PqRayNw7ajH0fdnE1VV9ns2M6fZdiPCuf8A95Hf7Ynu4z+3ZtzXNp6/k6DuLTcjTtRxauzdsXqeJj2TE+E0z4xMcxMeDYNHPXTo9tTq1t/4FrVn4NqdiifgOqWaY9djz48T+XRM+NE93nHE8TAZWj2nV7ppunpfuivQ9y4fYirmrEy7ffYyrcTx26Kv/OmeJjnvjweLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWb9AnpX91G97m/dXxe3pGgXIjEiun5N7N45pmP/ZxMVfpTR71etn7e1Tde6NN23otib+oajkU2LFHlzVPjM+VMRzMz5REy1b6WbL0zp9sLStpaTETYwbMU13ezxVeuz313KvfVVMz7u6PIHpwAAAAAAAAAAAAAAAAAAAAAAAAAAJmIjmZ4iARn6SnU2x0t6XZ2uUV251bJ/yXSrVXf28iqJ4qmPOmiImqfoiPGYZcZWRfysq7lZN65ev3q5uXblyqaqq6pnmapmfGZnv5TB6XXVOepnVG/wDa/Im5t/R5qxNMiJ+Tc7/vl7+nVEcfm00efKGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAer6SbH1PqL1A0raWl803My79+vccxYs099y5P0U8/TPEebVva2h6btnbmn7f0fHjH0/T8ejHx7fjxTTHEcz5zPjM+czMq/egf0s+5LYNW9tWxuzrO4bdNViK6eKrGH40R7puT8ufbHY9iyYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPNdSdjba6hbWyNubo0+jLw7vfRXHEXbFfHdct1fi1x7fPvieYmYnN/wBIPopuTpHr/q8ymvP0HJrmMDVLduYor8Zi3c8qLkRH4Pn4xz38aiur3Xt7Rd1aBlaDuHTrGo6bl0dm9YvRzFXnEx5xMTxMTHfExzAMexNXpNdBNa6TatOo4c3NR2pl3ZpxMzjmuxM98Wr3EcRV7KvCrjynmIhUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHuehfT3O6ndStM2ri+sox7tfrc/Ioj+YxqeJuV/Tx8mOfxqqYBaH7Hx0rjE03I6paxjff8uK8XRqa476LUTxdvR76pjsRPjxTX5VLfOLo+nYOj6TiaTpmNbxcLDsUWMezRHFNu3REU00x7oiIcoAAAAAAAAAAAAAAAAAAAAAAAAAABXj05Oqf3EdOZ2tpWT2Nd3FRVZ5oq4rsYvhcud3hNX4EfTVMfgp61/VtP0LRM7WtVyacbAwbFeRkXavCi3REzVPv7o8GVHWvf2f1L6kapuzO7dFvIudjDsVT/wCr49Pdbt+znjvnjxqmqfMHiwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEteir0ur6o9UsXCy7FVWg6b2cvVa/CKrcT8m1z7a6o7Pt7PamPBFFm3cvXaLVq3VcuV1RTRRTHM1TPdERHnLT70Wul9rpd0txNOybVMa3qHGZqtfn62Y7rfPsop+T7Oe1PmCVrdFFuim3bppoopiIpppjiIiPKH9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHB3Bo+l7g0XL0XWsGznadmWptZGPep5prpnyn/ziY74mImO9nZ6U/QDUOlep1a3odN/O2hlXOLV6r5VeFXPhauz7Pya/Pwnv8dIXE1nTNP1nSsrStVw7Obg5dqbV+xeoiqi5RMcTExIMchOHpTdB9T6Va9XqulW7uXtHNvT8EyO+qcSqe+LF2fbH4tU/hRHt5hB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADRn0JOlf3BdNadf1XG7GvbhooyLsVR8qxj8c2rfumYnt1R7aoifwVU/Q66WR1J6oWsjU8f1m3tD7GXn9qOab1fP3qzP6VUTMx500VR5w0rAAAAAAAAAAAAAAAAAAAAAAAAAAAB5Tq5vfTenXT7Vd26nMVUYdr7zZ54m/eq7rduPpqmPojmfIFZPshPVObVjG6V6PkfLuxRl61VRPfFPdVZsz9M8XJj3W/bKlrst0a5qW5dx6huDWMicjUNQyK8jIuT51VTzPHsiPCI8oiIdaAAAAAAAAAAAAAAAAAAAAAAAAAAAAADtNp6Dqe6Ny6dt3RsecjUNQyKcexbjwmqqeOZnypjxmfKImQWD9AzpX91e+q986vi9vR9v3I+DRXT8m/m8c0x7/AFcTFc++aPe0BeW6UbJ0zp5sDStpaVEVWsGzEXb3Z4m/dnvuXJ99VUzPHlHEeEQ9SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADr9y6JpW5NBzdC1zCtZ2nZtqbWRYuR3V0z/AGxMeMTHfExEx3wzV9JvopqnSPdXNn12ZtnPrmdNzau+Y7uZs3OPCun2+FURzHnFOnTo9+bT0Pe+1M7bO4sOnK0/Mt9iun8aifxa6J/FqpnvifKYBkGJC69dK9b6T72u6HqUVX8C92rum50UzFGTa5/srp5iKqfKZjymJmPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH2wcXJzs2xhYdi5fyci5Tas2rdPNVddU8U0xHnMzMQ+K1n2P/pZOtbmv9SdXx+dP0iubOm01x3XcqY+VXHtiimf96qOO+mQWn9HTptjdLel+n7d7NurUrkfCdUvU9/rMmuI7URPnTTERRHupifGZSKAAAAAAAAAAAAAAAAAAAAAAAAAAADPr08Oqcbu39TsnScjt6Nt25VTfmmfk383wrn39iOaI9/b8phav0q+qNPS7pblZuHepp17UucPSqfGabkx8q7x7KKe/zjtdiJ8WYdyuu5cquXKqq66pmaqqp5mZnzkH5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXX+x8dK/g2HkdU9Zxpi9kRXi6NTXT+Db8Lt6PpmJoifZFftVe6IdP8/qZ1J0vamH27dq9X63Nv0xz8HxqeJuV/Tx3R7aqqY82q2h6XgaJo2Ho+lYtvFwMKxRYx7NEfJt0UxxTEfqgHMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4rrR020LqlsjJ23rVEW65++YWZTRzcxL0R8m5T7fZMc98TMe+Mveouztc2FvDP2vuHG9RnYdfHMd9F2ifwblE+dNUd8T+qeJiYa7oa9KnovidWNm+twKLdndGmUVV6dfnui7HjNiufyavKfxauJ8JqiQzMH31HDy9Oz8jAz8e7jZeNdqtX7N2maa7ddM8VUzE+ExMTHD4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA73p/tXVd7bz0vaui2+3m6jkRZomY+TRHjVXV+bTTE1T7olq90/2rpWyNmaXtXRbc0YOnWItUTP4Vc+NVdX51VUzVPvmWdnob722psDq7c1/eGpRp2n/au9YovTj3L3Fyqq3xHFumqrviKu/hcr40fQn58/VOb/AAQTMIZ+NH0J+fP1Tm/wT40fQn58/VOb/BBMwhn40fQn58/VOb/BPjR9Cfnz9U5v8EEzCGfjR9Cfnz9U5v8ABPjR9Cfnz9U5v8EEzCGfjR9Cfnz9U5v8E+NH0J+fP1Tm/wAEEzCGfjR9Cfnz9U5v8E+NH0J+fP1Tm/wQTMIZ+NH0J+fP1Tm/wT40fQn58/VOb/BBMwhn40fQn58/VOb/AAT40fQn58/VOb/BBMwhn40fQn58/VOb/BPjR9Cfnz9U5v8ABBMwhn40fQn58/VOb/BPjR9Cfnz9U5v8EEzCGfjR9Cfnz9U5v8E+NH0J+fP1Tm/wQTMIZ+NH0J+fP1Tm/wAE+NH0J+fP1Tm/wQTMIZ+NH0J+fP1Tm/wT40fQn58/VOb/AAQTMIZ+NH0J+fP1Tm/wT40fQn58/VOb/BBMz83rluzaru3blNu3RTNVddU8RTEeMzPlCG/jR9Cfnz9U5v8ABRH6VfpL7Q1vple2v031y5qOXq8zYzr9OJesRj43Hy6fvtFPM189nu5+T2+eJ4BAHpS9T7nVHqll6jjXq50TT+cTSrcz3eqpnvuce2ufle3jsx5IoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHr+jlzZmP1E0vN3/dvU7fxLvwjItWrE3ZyJp76bU0x+LVPHPu5jzBef0IOlc7E6bRuPVsabevbipov10108VY+N42rfumee3V4fhUxMc0rBK/x6XnRqI4jN1mIj//AF1X97+/G86Nf6brP9XVf3gn8QB8bzo1/pus/wBXVf3nxvOjX+m6z/V1X94J/EAfG86Nf6brP9XVf3nxvOjX+m6z/V1X94J/EAfG86Nf6brP9XVf3nxvOjX+m6z/AFdV/eCfxAHxvOjX+m6z/V1X958bzo1/pus/1dV/eCfxAHxvOjX+m6z/AFdV/efG86Nf6brP9XVf3gn8QB8bzo1/pus/1dV/efG86Nf6brP9XVf3gn8QB8bzo1/pus/1dV/e++N6WvRW7RNVzW9Sx5ieOzc027Mz7/kxIJ4EG/Gw6JfOTN/qzI/wHxsOiXzkzf6syP8AACchB9v0ruiFdymmrc+XbiZ4mqrS8jiPfPFEy5Xxo+hPz5+qc3+CCZhDPxo+hPz5+qc3+C5vxkeiXz+wv3a//DBLIirH9Ivorfuero3/AKdE8c812r1EftqoiHJ/l+6N/wCsLRf9+r+4EmCPrfW3pFXRTXT1G21EVREx2s+iJ/XEzzDk43V/pRkUTXb6k7RiInj75rFiif2VVRIPcDyeN1N6b5UVTjdQdp34p/C9XrOPVx9PFbmYu99l5Xa+Dbv2/f7PHa9XqVmrjnw54qB6Adbjbg0HKpmrG1vTb8UzxM28qirj9kufYvWci1F2xdt3bc+FVFUVRP64B+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVJ9OrojGrYF7qhtbD51DFoidax7dPffs0xxF+Ij8aiIiKvbTHP4s80dbL10010TRXTFVNUcTExzEwzl9MfotPTTd8a9oOLVTtTWLszYimPk4d+eZqsT7KeOaqPdzH4szIQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADm2dX1axNE2dTzbU2+Ox2L9Udnjw44nudljb13ljVzXjbt1+zVMcTNvUb1MzH6qnQAPY4vVXqfjU0UY/Ubd9uiieaaKdayOzHfz4dvh2uN106wY81Tb6ibgq7Xj6zKm5+ztc8I5AS5iekp1vxZpm1v3Kq7NPZj1uHjXO739q3PM++e92+F6WHW3H7HrdyYeX2eefXaZjx2vp7FFP9nCDAFjML0yOrmP2fW4+2cvszPPrsCuO19PYuU/2O7wPTa37RFPw7ae2r88T2vU+vtc+zjmurhVgBcPC9OTPoiPhvTfGvT2e/wBTq9Vvv9vfaq7vc9Bg+m/tquqPh2xNXsRz3zZzLd3u9vfFPeo4A0D0/wBNDpXkREZWk7qw6uI5mvEs1U/qmm7M/wBj0mneld0RyuPXbmy8GZjwv6ZkT5+HyKKmbADU3TOvfRzUJiMfqHolH/vF2bH/ABIpep0rfeyNVmmNL3lt3Pmr8H4Nqdm5z38d3ZqnzZEgNlrddF23Tct1010VRzTVTPMTHul+mOWm6nqWm3PWadqGXh1889rHvVW5/bTMPXaT1h6qaVxGF1D3PTTHhRc1K7dojx8Ka5mPOfIGr4zT0X0p+tmncRc3TZ1C3HhRl6fYq9v41NFNU+Pt8nuNE9NfqBjzTTq+2NuZ9ET3zYi9YrmPpmuqP7AX0FRtB9ODQLvZjXth6nh+Haqws2jI+mYium3+zn9aQdv+lr0Y1SaacrV9T0eqriIjO0+5PfPtm124j6eeATwPHbc6p9NtxTTRo2+dvZd2ueKbMZ9um7P9CqYq/sewpmKqYqpmJiY5iY8wf0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0HUPaOjb62dqO1teseuwc61NFUxx2rdXjTcpnyqpniYn3O/AZH9U9kax073zqO09boj4Rh1/Iu0xxRftT30XKfdVHf7p5ie+JeXaQ+mT0fjqVsKdX0bFivc+iUVXcWKKflZVnxrsd3jP41P50cRx2plm/MTE8THEwD+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO923vHdu2q6atvbn1nSZpnmIw825aj9cUzES6IBOW1fSs6zaHNNN/XcPW7VPhb1LCoq5+mq32K5/wB5MGz/AE38aqbdrd+xr1uP85kaXlRXz9Fq5Ef8RS0Bp7sr0j+j26pt28fd2PpmTX/mNUonFmJ9nbq+9zP0VSlfFyLGVj0ZGNet37NyO1Rct1RVTVHtiY7phjW9Hsvfe8tmZMX9rbm1TSZ7Xaqox8iqLdc/nUfg1fRMSDXUUS6c+mjuzTZt4u+NBw9dsRxFWViT8GyI9szT326p90RR9KzXTP0gOlu/ptY+l7jtYGo3OOMDUojHvc/k08z2a591FVQJTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZ++nT0i+4/eX3c6JjdjQtdvTORRbp+TjZkxzVHui5xNce/tx3RENAnn+o20dI33srU9qa3a7eHqFmbc1RETVar8aLlPP41NURVHvgGQ477qDtTVtj7z1Taut2uxm6dfm1XMfg3KfGmun82qmYqj3TDoQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASp0t6/wDU/p76rH0vX7mfplviI07Uub9iKY8KaeZ7VuPdRVStr0n9LvYO6JtYG7LNzaepVd3rL1XrcOufddiOaP6dMRH5Us9gGyWDl4ufh2szBybOVjXqYrtXrNyK6K6Z8JpqjumPfD7MoelnVrfvTXMi7tXXb1jGmrtXcG999xbvt7Vue6Jn8qnir3rndFvS12Xu71Gl7yoo2rrFXFPrblfawr1XuuT32/or7o/KkFkB+bNy3etUXbVym5brpiqiumeYqifCYnzh+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVa9PvpVG4Np2+o2j43Op6Lb9XqEUR33sTnntT7ZtzMz+jVVz+DChjZPLx7GXi3sTKs0XrF6iq3dt1xzTXTMcTEx5xMTwy19JHpte6XdU9Q0CmmudMvf5Xpd2rv7ePXM8Rz5zTMTRP6PPnAI2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABLHRPr7v3pdet4un5v200KKubmlZtU1WuPP1dXjan9Hu575plfHol1x2N1VxKbej5vwHWaaO1e0nLqim/TxHfNHlcoj8qnw84p54ZbPvg5eVgZlnNwcm9i5ViuK7V6zcmiu3VHhVTVHfEx7YBsiKXejz6XVy1NjbvVaublvut2NctW/lU+Uevop8f06Y59sT31LlafmYmo4NjOwMqzl4mRRFyzfs1xXRcpmOYqpqjumJ9sA+4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDPTR6Y/wAoHSm9qGnY03dd2/FeZhxTHNVy1xHrrUe3mmmKojzqoiPNOYDGcTB6XHTb+Tjq/nY+Fj+q0XVuc/TezHFNFNUz27UezsV8xEfkzRPmh8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABL3o+de919Js+jEt1Vartq7XzkaXer4innxrs1f5uv8Asq8454mIhAa39MN/7X6j7Xs7g2tqFOVj1fJvWquIvY1zzt3KPGmqP2THfEzExL1LJLpb1B3P023Ta3DtfPnHyKfk3rNfNVnJt899u5Tz8qn+2J74mJ72kPQPrLtnq5t74VplcYWsY9EfD9LuVxNyxPh2qfy7cz4VR7eJ4nuBJgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIT9Mvpt/KD0gysjBx/Wa1oPaz8LsxzVXTEffrUfpURzER41UUQzTbMTETHExzEsvfSq6efycdY9U0vFsRa0nOn4fpsU/g02bkzzRHs7FcV08eymJ8wRSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7nZm59d2duPF3DtvUb2n6li1c271ufGPOmqJ7qqZjumJ7pdMA089GzrdovV3bnE+qwNy4duPthp/a8fL1trnvm3M/rpmeJ8pqlxj7tDcetbS3Hh7h29n3cDUsO527N63Ph7YmPCaZjmJie6YmYlpj6OnWPRuru0fhliKMPW8OKaNS0/t8zbq47rlHnNurv4nynmJ8OZCUQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFdPT36f/AHU9Jqd0YVia9S21cnInsx31YtfEXo/VxRXz5RRV7Vi3w1HDxdR0/J0/OsUZGJlWqrN+1XHyblFUTTVTPumJmAY3D1XVzZ+TsHqTru0sntz9r8uqizXVHfcsz8q1X/Sommf1vKgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPS9M9769083lhbo25k+pzMariuirn1d+3Mx2rVyPOmrjv9ndMcTETHmgGs3RzqJofU/Y2JufQ6+zFz73lY1VXNeLeiI7Vur6OeYnziYnzeyZb+jf1b1LpLvu3qVE3cjRMyabOq4dM/wA5b57q6Y8O3RzMxPn3x4VS080LVdP1zRsPWNJyreXgZtmm/j3rc8010VRzEx+oHMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABS/7I7sbs39A6h4dnuridMz6qY845rs1T+r1lPPupj2KbtYuuuzLe/+k24drerpryMrEqqw5q/FyKPl2p58vl0xE+6ZZP3aK7Vyq1doqoromaaqao4mmY8YmPaD8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALYegd1mnRNYo6Y7jy+NM1C7M6PduVd1jIqnvs8+VNye+I8q/01T36tV12rlN21XVRXRMVU1UzxNMx4TE+0Gywh30TerFHVLptarz71M7i0ns42p0edyePkX/oriJ5/Oiry4TEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzG9MHZkbL68a5YsWZtYOqVRqeJ3cR2b3M1xHui5FyI90Q05VS+yN7QjP2Loe9Me3Hr9Ky5xMiYjvmzejmmZn2U10REf8AtJBRQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEjejr1JyelvVDT9xRVXVptyfg2p2ae/1mNXMdqePOqmYiuPfTx4TLUzAy8bPwbGdh3qL+NkWqbtm7RPNNdFUc01RPsmJiWNq+32P7qbO4NlZPT7VL/a1DQafWYU1Vc1XMSqrw/7uqYj9GqiPIFogAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHk+se1KN79Ldx7Vmmmq5qGBcosdrwi/Edq1M/Rcpon9T1gDGm5RXbuVW7lNVFdMzFVNUcTEx5S/KUPSp2r9yHXrdGm27fYxcjK+H43Hh6u/HrOI91NVVVP9FF4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2PRjfGZ066l6NuzEmqqjEvxGVapn+esVfJuUfrpmePZMRPk8cA2Q03NxNS07G1HAv0ZGJlWaL9i9RPNNy3VEVU1R7piYlyFb/QD39O5ulN7ambe7eobbuxao7U99WLc5qtz/RmK6PdFNPtWQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSr7JNtjsantXeVm3/PWrum5NXsmifWWv29q7+xTxpf6a+2/uj9HnXardvt5GlVWtSs93h6uriuf/h1XGaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJh9D3fH3D9c9Gu373q9P1eftXmczxHZuzEUVT7OLkUTM+zlpuxooqqoriuiqaaqZ5iYniYlrF0K3fG++ke290VXO3kZeFTTlT/wD5FHNu7/46ap+iYB7UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHA3HpePrm3tS0TL/wDV9QxLuLd7ufkXKJpnu+iZY/6rg5Gmapl6bl0djJxL9di9T7K6Kppqj9sS2PZe+lxt/wC530ht24tNHZtZeXGfbnyq9fRF2qY/p1VR+oEUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALu/Y3d2zkbf3JsjIuxNWHfo1HEpme+aLkdi5Ee6KqKJ+muVIkzehfuf7mPSE0D1lzsY+rdvS7353rY+9x/8AFptg0yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUT+yR6HGL1D2zuKmninUdMrxauI8arFztTP7L1MfqhexWH7I1osZnSTRtbop5u6dq9NFU8eFu7brif8AxUWwUFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcvRdQydI1jC1XDr7GThZFvIs1eyuiqKqZ/bEOIA2K2/qePreg6frOJPONn4trKsz+Zcoiqn+yYc5EPoc6/O4PR22vdrq5vYNqvAuRzzx6muqiiP9yKJ/Wl4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFHpdaPOt+jpvDGppmquxiU5lMx4x6m5Rdmf92ir9SV3U700qNd2drehzTFUajp9/E7M8cT6y3VRx393mDH0f2YmJ4mOJgB/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXs+xt618J6e7n2/VVzVgapRlREz4U37cUxH0c2ap/XK1iiH2NzVvUdStyaLNcU05ukU5ERPHyqrV2mmI+ni7V/aveAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADIvqnpn2l6m7p0fs9mMLWMvHiOPKm9VEce7iB7T0vdNjS/SO3jjxTxFzKt5McefrbNu5P9tcgInAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABOfoK6lOB6R+i4/a7NOfjZWNV38R/M1XIie/2249vfw0lZX+jDnfa/0gdk5Ha7Pb1a1Y57XH87zb4/8fHvaoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzs+yBYHwP0ga8js8fDtJxr/ADx48du3z/8Alj0/2SXC9X1G2vqXZ/n9Iqsdrs+Pq71VXHPn/OeHlz7wFUwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAem6T5fwDqntLO7fY+D63h3e1xz2ezfonnjz8GuTHjbN6vH3Jpl+1PFy3mWq6Z454mK4mGw4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKafZMcTu2Jn00/wCnWa55/wDYTT3f7w7v7JPjdvYe1MzsUz6rVLtrtecdu1zx9HyP7IAUXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/aZmmqKqZmJieYmPJsuxnbMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArH9ketUT0Y0O/MffKNxWqKZ58qsbImf8A5YHqvTV/+6zTP+27X/AvgM2QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfq3RXcuU27dNVddUxFNNMczMz5Q2WY8bYs15G5dLx7fHbu5lminmfOa4iGw4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIy9JCmmrY+FFVMVR9sqPGP+quj++kd/0Iw/+0qP+FdAZZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9P0lxPh/VTaOD2O38I1zCtdnnjtdq/RHHPl4tcWV3oxYM6h6QOyceKYq7GrWr/ABNPP81985/8Hj5eLVEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEZ+kd/0Iw/+0qP+FdHW+lfqtOj9O8DJqszeirVrdvsxVx42b08/2AMxQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATl6C+m/D/SQ0O/NPapwMfKyaomOY/mK7cT+25H6+Gkyh32N7SvX9T9xazVTzGHo8WI91V29RMT9PFqqP1yviAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACvnp6arb0jpBpWTctVXYq1+zRxTPHjj5E//Qef+yRZE09J9vYnbpiLmu03Ox3cz2bF2Ofojt/2wAoUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC8/2NjRpsbH3XuCaOPhupWsSKvbFm32v/ANP/APrwtihv0LtC+0Xo6bbiu32L2oRdz7vd+F6y5V2J/wDhxQmQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFRPsluVFG29l4XNHN3MyrvEz8r5FFuO73fL7/1Dofsl2X29c2Rgdr+Zxsy9xx4duq1Hj/3YCoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD74GLfzs7Hwsaibl/Iu02rVMfjVVTxEftl8EteiJtj7qfSC2xjXLXbxsG/Oo3/ZEWI7dPPum5FEfrBpXtPR7G3traToGNx6jTcKziW+I45pt0RRH/k7MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUD+yN53r+sujYNM8042g25nx7qq796Z/sikeW9OnUIzfSQ1uzFXajCxsTHjjy+8UVzH7bkgIMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXO+xtbTmLe6N8X7XHa7Gl4tfH0Xb0f8H9imLVP0a9nTsXontvQr1n1WZOLGVmxNPFUX733yumr309qKPopgEigAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/lyui3RVcuVU0UUxM1VVTxERHnIMrPSW1L7a9fd7ZcV9uKdYv48T7rVXqo/8AkHjNzajVrG5NT1erntZ2ZdyZ58ea65q/+oDrgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASf6LmyPu+626DpF6z63Axrvw/PiY5p9RZmKppq91VXZo/ptSVXPsemwKtE2Bn76zrHZy9eueqxO1T304tqZjmPZ26+19MUUytGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8n1k1f7Q9Jd26xFfZrxNGyrlueeOa/VVdiOffVxH63rEJ+m9rP2o9HLX7dNfYu6hdx8O3Pa457V2mqqPfzRRXAM0wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHpOmO0NQ35v3R9paZExkajkxbm5xzFq3HfcuTHspoiqr9Tza8v2Pbpj9rNv5fUvVceacvU4qxdLiuPwcaKo7dyPfXXTxHuonyqBaXb2k4Gg6FgaJpdinHwcDHox8e3H4tFFMUxH7I8XOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABUz7JPrcWNlbU27FzirM1G7mVUx7LNvsRz+u/wD2e5bNn/8AZE9d+2HWTTdEt3O1a0rSaIqp5/Bu3a6q6v8AweqBWcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6tUV3blNq1RVXXXMU000xzNUz4REe0Hu+gnTnO6odS9O2xjdu3iTV6/Ucin/MY1Mx26vpnmKafzqo8uWqOj6dhaRpWJpWm49GNhYdmixj2aI4pt0UxEU0x9ERCIPRE6SU9L+nNN3U7EU7k1mKcjUZnxs08fe7H9GJnn86qrxiITSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAyt9JnXo3L163jqlNfbt/bKvGt1c900WIizTMe6YtxP62nm9Nbs7a2frO4b/Z9VpmBey6oqnumLdE1cfr44ZA5N+7k5N3Jv3Krl67XNdyurxqqmeZmf1g+YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC2foIdFp1jVLfU/cuH/AOjsG7/6Gs3Ke6/fpnvvcfk0THFPtq5n8Xvin0YejWf1b3nTRkRdxttafXTXqmXTHE1R4xZtz+XV/wCGOZ9kTplpOn4Wk6Zi6ZpuLaxcLFtU2bFm1TxTbopjiKYj2REA5IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIO9OPcX2g9HnV7FFz1d/V79nTrU+c9qrt1x+u3brj9bNhcL7JPuaLmq7U2faufzFm7qORR7Zrn1dqf1di7+1T0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB7rol0x1/qrvSzt/RafU2KeLmdnV0TNrEtedVXHjVPhTT3cz7I5mOL0j6dbk6nbvsbc25jdqur5eTk1xPqsW1z33K58o9keMz3Q016OdN9v8AS7ZePtvQbfa4++ZeXXTEXcu9PjXXx+yI8oiI94Ox6b7L0Hp/s/C2vtzF9Rg4tPfVPfXern8K5XPnVVPjP0RHERER6IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdB1G3HY2jsLXdz5E0xRpmBdyYifxqqaZmmn6Zq4j9YM3fS23P91XpAboy7dzt4+Fk/a6xx4RTYj1dXHumuK5/Wih9Mm/dycm7k37lVy9drmu5XV41VTPMzP63zAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAe86K9K90dVt006NoFj1ePb4qzc+7TPqcW3z41T51T5Ux3z7oiZj0no69BtydWtUpypi5pe2LFzs5epV0fh8eNuzE/h1+2fCnnmfKJ0X6ebL25sHa+NtzbGn0YWDYjmeO+u9XxETcuVeNVc8RzP0RHEREA67pD022x0v2pb0HbeJ2eeKsvLuRzey7kRx265/bxEd0c90PZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArb9kI3ZGi9G8bbdm52cncGdTbqp54mbFni5XP+/6mPoqlZJnh6f27o1/rZGhY92asXb2HRjTTzzT6+598uTH6qrdM++gFdgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAev6XdNt49SdbjS9p6Rdy5pmPX5NfyMfHifO5cnuj6O+Z47okHkaKaq64oopmqqqeIiI5mZWw9G/0UM/W6sbc/U6ze0/S+65Y0fns38mPGJuz426Pzfwp/N8519H70bdo9MosaxqPY17c9Mdr4bet/esar2WaJ8J/Pnmr2dnnhOQONpen4Oladj6bpuJYw8PGtxbsWLNEUUW6Y8IpiO6IckAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcHcGq4eh6DqGtahc9Xh6fjXMq/X+Tbopmqqf2RLIndut5W5N06ruHO/9a1PMu5d2InmIquVzVMR7o54X+9PjeX3OdFKtCx73YzdxZVOLEU1cVeoo4uXZj3d1FE+64ztAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2O3dC1ncWqWtL0HSs3VM67PyMfFs1XK59/FMeHv8ACAdc52haRquu6rY0rRdOytRz8irs2sfGtTcuVz7qY71oOkXoa7i1Wq1qHUbUqdDw54q+AYdVN3Krj2VV99Fv9Xbn3Qt9046c7L6eaZ8B2joGLp0VUxF2/Edu/e/TuVc1Vd/fxM8R5RAKp9EfQ5y8r1GsdUsycSzPFdOj4dyJu1e67djup99NHM/nRK4u19vaHtfRbGjbd0rE0vT7EcW7GNbiimPbM8eMz5zPMz5y7MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0HUXc+HsvYutbqzuzNnTMO5kdiZ49ZVEfIo59tVXZpj3yChHp5b0+6frZc0THu9vB27YjDpiJ7pvVfLuz9PM00T/7NX1ytX1DL1bVszVc+9N7MzL9eRfuT413K6pqqn9czMuKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADsdC0LW9eyvgmhaNqOq5Ezx6rDxq71f7KYmQdcJt2d6LXWTcU267u3rOh49fH37VMmm1x9NuntXI/XSm7Y/oSaRYm3f3pvHKzZ8asbTLMWaYn2esr7UzH9GkFJEldOuhfVHfnqr2ibVy7WDc8M7Oj4NY4/Kiqvia4/QipodsHov0w2PNu7t7Z+nW8u3305eRTORfifbFy5zNP9HiEgAqX0y9C3QcGbWZ1A3Be1e9HfVg6dzZsc+yq5Py64+iKJWX2Xs/a2zNMjTdraDgaRjd3apxrUU1XJjzrq/Crn31TMu9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFTfsi++vgG09H6f4l3i/qt34dmxE98WLc8W6Z91Vzmf8AulsapimmaqpiIiOZmfJlX6Rm+Z6idYde3HauzcwJv/BtP9kY9v5NEx7O1xNf01SCPAAAAAAAAAAAAAAAAAAAAAAAf2imquuKKKZqqqniIiOZmQfwTJZ9F/rpdtUXadi1RTXTFURVqmHTPE+2Ju8xPunvfr4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxj4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxj4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxkcb+2duLYm4rm3t1YFGBqlu3RcuY9OTavTRTVHNPM26qoiZjv4meeJifOAdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD3fTbpB1G6jadlajs3bVzU8TFuxZu3pyrNimK5jnsxN2untTxxM8c8cxz4wDwgmb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxj4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxj4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxj4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxj4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxj4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZviuddvmN9bYX8Y+K512+Y31thfxgQyJm+K512+Y31thfxj4rnXb5jfW2F/GBDImb4rnXb5jfW2F/GPiuddvmN9bYX8YEMiZL3ov9dLVqu7VsWqaaKZqmKdUw6p4j2RF3mZ90d7zf8AIp1c/wBXG5v6vuf3Aj8SB/Ip1c/1cbm/q+5/cfyKdXP9XG5v6vuf3Aj8SB/Ip1c/1cbm/q+5/cfyKdXP9XG5v6vuf3Aj8SB/Ip1c/wBXG5v6vuf3H8inVz/Vxub+r7n9wI/EgfyKdXP9XG5v6vuf3H8inVz/AFcbm/q+5/cCPxIH8inVz/Vxub+r7n9x/Ip1c/1cbm/q+5/cCPxIH8inVz/Vxub+r7n9x/Ip1c/1cbm/q+5/cCPxIH8inVz/AFcbm/q+5/cfyKdXP9XG5v6vuf3Aj8SB/Ip1c/1cbm/q+5/cfyKdXP8AVxub+r7n9wI/EgfyKdXP9XG5v6vuf3H8inVz/Vxub+r7n9wI/EiWOh3V6/di3R063HEz514dVEftq4hyf5Aesv8Aq91n/cp/vBGQk3+QHrL/AKvdZ/3Kf7z+QHrL/q91n/cp/vBGQk3+QHrL/q91n/cp/vffG9HfrTkRVNvp/qdPZ8fWV2rf7O1XHIIrEtfFu62/MHN/ecf+IfFu62/MHN/ecf8AiAiUTLR6LvXWqiKo2LPExzHOq4UT+yb3c/vxXOu3zG+tsL+MCGROVPoodbppiZ21h0zMeE6pj93/AI31seiX1ruXYor0LT7MT+PXqdmYj/dqmf7AQQLAfFC6yf6Fov8AWNP9zl0ehv1dqoiqb+2qZmOZpnPr5j3d1sFdBZXH9C3qtdt9qvWNoWZ5/Brzb8z/AOGxMf2uZjehP1Hqomcnc+1LdXPdFu7kVxx9M2oBV4WuxvQi3lVRM5O89At1c90W7V6uOPpmIc7H9B7W6rfOR1B063Xz4UadXXH7Zrj/AMgVDFy7PoM1TTRN7qdEVd3bpo0LmPfETN//AOjssf0HtDpuc5HUDUblHHhb06iiefpmuf8AyBSIXZ1v0Rul+3MbFq17fuvUXszJpxcO3RTZprybtcxFNu3R2ZmqqZ9ndEd88REy9Xjehf0otVzVc1bd2RExx2bmbYiI9/ybMAz7GjWH6InRmxNHrdP1jK7McT63Ua47Xvns8f2cO5wvRe6G4vZmNkxerpiflXtSyqufpj1vZ/sBmYNTsHoL0cwoiLPTzQ6uKez9+szd7v6cz3+/xd/p/TXp1p8xVg7B2ti1RMT2rWkWKZ5jwnmKPEGSdMTVVFNMTMzPERHm73S9mbw1Xs/azamvZ3anin4Pp125z38d3Zpnz7muGBpunafT2cDAxcSmI44s2aaI48eO6HKBlfpPQjrDqkR8G6d69b5jn/Kcf4P/AMWaXs9F9EjrRnzEZWk6XpXPnl6lbq48f/3Xb/8A1lo6Ao7oHoQblvTTOv750jCj8aMLEuZPl5TXNv8A/X9iRts+hd05wZpua3rmv6xciO+im5Rj2qv1U0zV/wCJZwBGW2OgPR3bvYqwdhaTeuUeFedTVlzz7fv01RE/R+pI2Dh4eBjU42Di2MWxT+Dbs24opj6IjufcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABC/pl79+4bolqVOLf9Xqmt/+jcPiflRFcT62uOPDi3FXE+VU0sz0/wDp09QI3h1ju6HhX/WaZtqirBo7M801ZEzzfq+mKoi3/wB370AAAAAAAAAAAAAAAAAAAAAAAALHegr0rjefUGd36tjdvRNu3KblEVx8m/meNun3xR+HPv7HlKAdt6NqO4tfwNC0jGqyc/Pv0Y+Pap/GrqniPoj2z5RzLVro7sXTum/TvStpad2a/glrnJvxTxORfq77lyfpq5458IiI8geuAAAAAAAAAAAAAAAAAB5bqxvbS+newNV3bqtVM2sKzM2rPa4nIvT3W7VPvqqmI58o5nwiWUe69d1Pc+5dR3DrORORqGoZFeRfr8pqqnniI8ojwiPKIiFhPTy6qTuzfVGxtJye1o237kxkTRV8m/mccVT/AN3HNEe+a/crQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADs9raHqW5tx6ft/R8ecjUNQyKMfHt88RNVU8RzPlEeMz5REy1a6SbH0zp10/0raWl8VW8O19+vccTfvT33Lk/TVM/RHEeSsv2PbpZFrGyeqmsY/3y728TRaa48KO+m9ej6Z5txPuue2FxQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcHXtX0vQdHydY1rPx9P0/Fomu/kX7kUUUU++Z/Zx5z3A5yCfSH9JLa/TKm/oukep17dURNPwSiv7ziVeU36o8/zI+VPn2eYlBXpFellqevTkbc6Z3MjStKnmi9q0xNGVkR/1UeNqn3/hz3fg98TXLp/tfVt9b40va+k0zcztTyYtxXV3xRHjXcq91NMVVT7okFxPQ50vdPUveuodbuoObez7uNNeFolNcRTatVTHF2q1R4U000z2I48Zqr55mOVtHTbH21pmztoaXtjR7Xq8HTcamxaiY76uPGqr86qeapnzmZdyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8H1+37Z6b9Kda3RNdv4XbtepwKK/85k1/Jtxx5xE/KmPZTL3ihX2QfqL9vd94ewtOye3gaFT63Mimfk15dceE+3sUTEe6a64BWDIvXsnIuZGRdru3rtc13K655qqqmeZmZ85mXzAAAAAAAAAAAAAAAAAAAAAAHsOjexNQ6kdRdK2np/aojKu9rJvxHPqLFPfcuT9EeHtmYjzBZ37Ht0r4jI6qazjePbxNFpqj6ab1+P7bcT/7Tu8JXLcDbmj6dt7QMDQtJx6cbAwMejHx7VP4tFMcR9M93fPnLngAAAAAAAAAAAAAAAAIo9Kfqhb6XdLMvUMW9TGuahzh6VRz3xdqj5V3j2UU81eznsxPilW7XRat1XLldNFFETVVVVPEUxHjMyzC9KnqjX1R6pZWfiXq6tC07nD0qiZ7ptxPyrvHtrq+V7ez2YnwBFN65cvXa7t25VcuV1TVXXVPM1TPfMzPnL8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9p0U2Dn9S+pGl7Twe3RbyLnbzL9Mf8Aq+PT33Lns547o58appjzeLaJeg50s+4fpxG59Vx+xrm4qKL0xVTxVYxfG1b901c9ufppifwQTzoOlYGhaJhaNpWNRjYGDYox8ezR4UUUxEUx+yHNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfm9ct2bVd27cpt26KZqrrqniKYjxmZ8oVL9In0tcLSZydt9Lq7OfnRzbva1VT2rFmfCfU0z3XKo/Kn5Ps7XPcE19cOtWzek+mTXrWT8M1e7bmrE0rGqib932TV5W6Ofxp9k8RVMcM9utfWLeXVfWPhOv5fqNOs1zViaZjzMY9iPKePx6+PGqe/x44jueG1nU9R1nVMnVdWzsjOzsmubl/Iv3JruXKp85me+XEAXj+x7dMPtboWX1M1bG4ytRirF0qK6O+jHifvl2Ofy6o7MT7KJ8qlUOiews7qV1J0raeH26LeRc7eZfpjn1GPT33K59nd3Rz41TTHm1Z0bTcHRtIw9I0zGoxsHCsUY+PZoj5Nu3RTFNNMfREQDlgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8n1e3tg9POnOs7uzuzVGDYmbFqqePXXqvk27f66piJ9kcz5MntY1HM1fVszVdRv1ZGZmX68jIu1T313K6pqqqn6ZmVofshPUqNZ3ZhdOtLyYrwtGmMnUOxVzFeXVT8mif0KJ/bcqie+FUwAAAAAAAAAAAAAAAAAAAAAAGhnoK9LPuM6eTu7Vsbsa3uKim5RFUfKsYfjbp901/hz7poie+lVP0TOltXU/qlj2c6x29A0ns5mqTMfJrpifkWf6dUcfoxXPk03piKaYppiIiI4iI8gf0AAAAAAAAAAAAAAAAHW7p1zTds7c1DcGsZEY+n6fj15GRc8eKaY5niPOZ8IjzmYgFffTw6qfclsOnZGkZHZ1ncNuqnImiriqxh88Vz9NyeaI93b9zPt6vq1vfU+ovUDVd26pM03My7PqbPPMWLMd1u3H6NPEc+c8z5vKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+uLj38rKtYuNZuXr96uLdq3bpmqquqZ4imIjxmZ7uATD6IfSz+U3qjZ+2OPNzb2jdnL1KZ/Bu9/3uz/Tqiefzaa+/nhplEREcRHEQjT0a+mdjpb0uwNDrotzq2RHwrVb1Pf28iqI5pifOmiOKY+iZ85SWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8t1N6g7U6c7dr1zdmqW8Kx3xZtR8q9kVx+Jbo8ap8PdHjMxHeif0iPSb2106jI0LbfwfX90UxNNVqmvnGw6v8AraqZ76o/Ipnn2zSoPvzeO5d87hva9unVsjUs673dq5PFNunyoopjuopj2REQCT/SE9IvdnVG7e0nDm5oe1+eKcC1X8vIiJ7pv1x+F+jHyY7vGY5QiAAJP9GTprc6odVsDRb9qqdIxf8ALNVrieOLFEx8jn21zMUx598z5Atx6BvTCNpdOqt56nj9nWNx0RXa7UfKs4cd9uP6c/Ln2xNHsWRfmzbt2bVFq1bpt26KYpoopjiKYjwiI8ofoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB43rVvzB6bdNdW3bmRTXXjWuxiWZn+fyKu63R9HanmePCmKp8nsmfvp69UPur6gW9kaXk9vSNu11RkTRV8m9mTHFc/wDdxzRHsmbntBXPV9QzNW1XL1XUcivIzcy/XfyLtc/KuXK6pqqqn3zMzLigAAAAAAAAAAAAAAAAAAAAA+mPZvZORbx8e1XdvXa4ot0URzVVVM8RER5zMvms96A3Sz7pt6Xd/wCr43b0rQbkU4dNdPyb2ZMcxPvi3ExV+lVR7JBar0Y+mNnpb0twtIvW6ftxmcZeq3Innm/VEfIifyaI4pjy5iZ80oAAAAAAAAAAAAAAAAAApX9kI6qRfycfpXo2TzbszRl61VRV41/hWrE/RHFyY9s2/OJWg62b/wADpn031TdmbFFy5Yo9Xh2Kp/n8irut0e3jnvn2UxVPkyo17Vc/XdbzdZ1XJryc/Ov15GRer8a66pmap/bIOEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAtL6AfSv7oN23eour4/Om6Jc9Xp9Ncd17LmOe1Hti3TMT+lVTx4SrpsbbWqbx3dpe19Fs+tz9SyKbFqJ54p58a6uPCmmmJqmfKImWrvTfaGlbD2RpW09Go4xNPsRbiuY4qu1+Ndyr86qqZqn6QehAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFfXfrns7pNp9VvUL32y125R2sbSceuPW1cx3VXJ74t0e+e+fKKgSFufXtG2zomTre4NSxtN07Gp7V3Iv19mmn3e+Z8IiOZme6FGvSK9K7WN1fCNu9O68nRdEnmi9qE/Iy8qPPs8fzVE+75U+cx30ob6ydWt5dVNb+Hblz+MS1VM4mnWJmnGxo/Np576vbVPMz7eOIjwQP7MzM8zPMy/gAAANLPQ36Yfyc9KbGRqFj1eva72c3PiqPlWqePvVn+jTPMx5VV1R7FRPQy6Yfyh9VrOdqGP6zQtAmjNzO1TzRduc/ebM+3tVRMzHnTRVHm0nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/K6qaKJrrqimmmOZmZ4iIBGHpN9TbXS7pbm6xZuUfbjL5xNKtz3836on5cx+TRHNU/REebLq/eu5F+5fv3a7t25VNdy5XVNVVVUzzMzM+MzPml/wBLXqnV1P6oZFzAyJr2/pPaxNMiJ+TciJ+Xe/p1RzH5sUIdAAAAAAAAAAAAAAAAAAAAAAB2+zNu6pu3dWm7a0Wx6/UNRyKbFmnyiZ8apnypiOZmfKImWrvTDZ2l7A2HpO0tIp/ybT7EUTcmOKr1ye+u5V76qpmr3c8R3QrT9j66VxgaVkdUNZxuMnNpqxtIprp76LPPFy7HPnVMdmJ9lNXlUt0AAAAAAAAAAAAAAAAACGfS96px0z6XX6dPyPV7h1mKsTTez+Fa7vvl7+hTMcfnVUd3HIKp+nH1TnfHUidsaVkdvQtu11WYmifk38rwu3PfFPHYj6KpjuqV5f2ZmZ5meZl/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAASB6P3TnL6o9TtO2zZiujCifhGo36Y/mcaiY7c8+UzzFEfnVQC0n2PzpX9q9DyOpus43GZqVM4+k01x328eJ+Xd9011RxE/k0z5VLaOPpmDiaZpuNpun49vGxMW1TZsWaI4pt0UxEU0x7oiIhyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHzyb9nGx7mRk3rdmzapmu5cuVRTTRTHfMzM90RHteT6q9StodM9vzrG69Tox4qifg+LR8rIyao/Ft0eM+XMzxTHMczDPv0gfSC3d1Wybmn0116Ntmmvm1pli5P33ie6q9VHHrJ8+PwY7uI575CcvSK9Lezi/CdtdKrlGRe77d/XKqebdE+ExYpn8Kfz57u7uirmKlMtTzs3U9Qv6hqWZkZmZkVzcvX79ya7lyqfGqqqe+Z98uMAAAAAPpj2b2TkW8fHtV3b12uKLdFEc1VVTPEREeczL5rK+gV0w+6vqDc3tqmP29I27XTVYiun5N7MmOaI/7uPlz7J9X7QW39Gjpta6X9KtO0S7bo+22RHwvVLkRHNWRXEc0c+cURxRHt7PPmkwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFbPTs6sfcfsaNk6NldjXNftTF+qieKsfD5mK6vdNcxNEe7t+ExCeN+bo0nZW0NT3Trl/1OBp1ibt2Y/CqnwpopjzqqqmKYj2zDKfqdvPVuoG+dU3ZrVf+U516aqbcVc02Lcd1Fqn82mmIj38cz3zIPNAAAAAAAAAAAAAAAAAAAAAAPd9B+nmb1P6maZtfGi5Ri11eu1C/RH8xjUTHbq90zzFMfnVUvCNHfQo6V/yf9M6db1XG9XuDcNNGTkRXTxXYscc2rXf4TxM11R3TzVxP4MAnHSNPwtJ0rE0vTca3i4WHZosY9miOKbdumIimmPdERDlAAAAAAAAAAAAAAAAAD5ZeRYxMW9l5V6izYs0VXLtyueKaKYjmZmfKIiOWW/pJ9S7/AFS6o52u0VV06Vj/AOS6Xaq/Ex6ZniqY8qq5map+njyhaj0/eqn3P7Ss9OtHyezqWt2/WahNM99rDieOz7puVRx+jTVE+MKGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANI/Qw6V/yd9Mbep6pjTb3Br9NGVlxXTxVYtcc2rPumIntVR49qqYn8GFU/Qv6V/yh9TaNV1XF9bt7QJpycqK6eaL97n71Z98TMdqqPDs0zE/hQ0hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB1O7ty6FtLQcjXdyapjaZp2PHNy/fr4jnypiPGqqfKmOZnygHbK5+kT6UW3thTk7e2h8H1/clPNFyuK+1i4VXh8uY/DrifxKZ7vOYmOEE+kT6VGvb0nJ29sacjQtvVc27mTFXZy8ynwnmY/m6J/JjvmPGe/sxWkHdb03VuHee4L+vbm1XI1PUL8/Ku3qvwY8qaYjuppjypiIiHSgAAAAAADm6Hpefres4Wj6Xj15OdnX6MfHtUeNdyuYppj9stWui+xMHpt030naWF2K68W12sq9TH8/kVd9y539/E1c8c+FMRHkql9j16YfD9Zy+p+rWOcfAmrE0mKo/CvzT98u/RTTV2Yn21VedK7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIK9MXrFT0z2JOlaPkxTujWrdVvE7M/KxbXhXfn2THhT7au/v7MwCvHp29Xvus3ZGwdCyu1omiXpnMrt1fJycyOYmPfTb76Y/Omrx4iVY39qmaqpqqmZmZ5mZ838AAAAAAAAAAAAAAAAAAAAAB99PxMrUM/HwMKxcyMrJu02bNq3HNVyuqYimmI85mZiATV6G3Sv+UfqdbzdTxpubf0KaMrN7VPyL1zn71Zn29qYmZj8mmY84aTo89Hnpvi9LumGnbcopt1ajXHwjU79EfzuTVEdrv8AOKe6iPdTE+MykMAAAAAAAAAAAAAAAAB0u+dzaVs3aGp7o1q96rA03HqvXZjxq47qaKfbVVVMUxHnMw7pRv7IH1U+2uu4/TLR8jnD02uMjVaqJ7rmRMfIt8+yimeZ/OqjzpBWzqRu7Vd9731Xdms185eoX5uTRFXNNqjwot0/m00xFMe6HngAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcnS8DM1TU8XTNOxrmTmZd6ixj2bcc1XLlUxFNMR7ZmYhxltvsffSuNT1vI6nazjc4mnV1Y2k0V091zImPl3e/wAqKZ4ifyqp8JoBaToD05xOl/TLTts2fV3MyI9fqN+mP57JriO3P0RxFMe6mHvgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHxzsvFwMO9m52TZxcWxRNd29euRRRbpjxqqqnuiI9sqcekT6XEz8J230pucR327+u10d/vjHpqj/wDMqj29mPCoE4dfOvmz+lGHXi37tOrbiqo5s6Vj3I7VPMcxVeq7/V0/TEzPlE98xnz1b6obw6oa99td06jN2iiZ+DYdrmjHxqZ8qKOfH21TzVPnMvIZuVk5uXdzMzIvZOTermu7eu1zXXcqmeZqqqnvmZ9sviAAAAAAAAA7vYe2NU3nvHS9raNa9ZnalkU2bfspjxqrn82mmJqn3RLpF3vsevTCcHSMvqfq2PxkZ0VYmkxXHfTZieLl2PZ2qo7MT48U1eVQLPbB2vpeytm6VtbRrfYwtNx6bNEzEdquY/Crq4/Gqqmap98y7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfyuqmiia66opppjmZmeIiAdD1D3do2xdnajunXr/AKnBwbU11RHHauVeFNumPOqqeIiPeyu6qb41nqLvnUN2a5X/AJRl1/e7NMzNGPajuotUe6mP2zzM98ylX0yOtNXUreH2g0LJqnauj3ZpsTTPycy/HMVX59tPHNNHu5n8aYiAgAAAAAAAAAAAAAAAAAAAAAAFsPsfvSudX3Ff6maxjc4OlVzY0umunuu5Mx8q53+MUUzxH51XdPNCt3Tvaeqb43rpW1NGo7WZqN+LVNUxzTbp8aq6vzaaYmqfdDV3YO1tK2Vs3S9raLa9Xg6dj02bfdxNc+NVdX51VUzVPvmQd4AAAAAAAAAAAAAAAAACP/SB6jYnS/phqW5rs2686Y+D6bYqn+eya4nsRx5xHE1z+bTLLDU87L1PUsnUtQyLmTmZV2q9fvXJ5quV1TM1VT75mZlNfpndVI6idT69O0vJ9Zt/QJrxcOaZ+Teu8/fb3viZiKYnw7NETHjKCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAej6a7P1Xfu+NK2no1Ezlahfi32+zzTZo8a7lX5tNMTVP0NXNkba0rZ20tM2xoln1OBp2PTYtR51ceNVXtqqmZqmfOZmVdfQE6V/c7tC71E1jGinU9ct9jAiun5VnD557Xum5MRP6NNM+crRgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPEdXuqez+l2gzqe59Rii7cifguDZ4qycqqPKijnw9tU8Ux3cz3wh70ivSp0LZsZO3dh1Y2ubgp5t3cvnt4mHV598fzlcfkx8mJ8Z5iaVFd27k13dmu5Gubj1TJ1PUciebl+/VzPuiI8KaY8qYiIjygEi9e+vW8OrGZVjZN2dK29br5saVj1z2J48KrtXjcq+nujyiO+ZiQAAAAAAAAAAAew6NbEz+pHUbSdpYPbojLu85N+mnn4PYp77lyfLup8OfGZiPNq3oOlYGhaJhaNpWNRjYGDYox8ezR4UUUxEUx+yFdvQJ6YfcrsC5vjVcbsavuGiJx4rp4qs4UTzRH/eTHb98RbWWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVL9OjrfGj4F7phtbL/8ASOXb41nJtVd+PZqjmLETH49cd9XspmI/G7pT9KXrNh9JtlzGHctXtz6lRVRpmNVxV6vym/XH5FPlE/hVcR4dqYzQ1HNy9S1DI1DUMm7lZeTdqvX712qaq7ldU81VVTPfMzMzPIOOAAAAAAAAAAAAAAAAAAAAAACSPRx6aZHVLqhgbfmmunS7M/CtUvU8x2MemY7URPlVVMxRHvq58IkFp/QA6V/aPa17qRrGN2dR1iibWm01099rEie+uPZNyqP92mJjuqWpfLCxsfCw7GHh2LePjWLdNqzat0xTTbopjimmIjwiIiI4fUAAAAAAAAAAAAAAAABBHpo9VP5PemVzSdLyfV7g1+mvFxZoq4qsWeOLt72x3T2aZ/KqiY/BlN2qZ+HpemZWpajk28bDxLNd/IvXJ4pt26Ymaqpn2RETLK7r91GzOqHU3UtzX+3Rh9r1GnWKv8zjUzPYjj2zzNU/nVSDwIAAAAAAAAAAAAAAAAAAAAAAAAAAAAACTfRp6ZX+qfVHB0O5Rcp0jG/yvVb1Pd2bFMxzTE+VVc8UR7OZniezKM6YmqqKaYmZmeIiPNpl6IvSyOmXS6x9sMeLe4NYinL1OZj5Vvu+92f6FMzz+dVX5cAmHFsWMXGtYuNZt2bFmiLdq3bpimmimI4imIjwiI7uH0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEM+kD6Qu0elePd06iqnWdzVUfetNsVxxZmY7qr9X4kefHfVPd3RHfASXvbdm3dlbfv69ujVcfTNPs903bs99VXlTTTHfVVPlTETKhnpFelBuHf8A8J2/tL4RoO2auaLkxV2crNpnx9ZVE/Ion8ime/v5meeIiTqp1H3b1L3DVrO69Trya6eYx8ej5NjGpn8W3R4R4RzPjPHfMvIAAAAAAAAAAAAAJL9Gvpvd6odVtO0G5RVOlWJ+F6pXEzHGPRMdqnmPCa5mKI9na58kaNJvQv6Y/wAnvSmzqGo4/q9d3BFGZmdqPlWrXE+ptT7OKapqmPKquqPIE349m1j49vHx7VFqzaoii3RRHFNNMRxERHlEQ/YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPH9X+oeg9MtkZe59euc0W47GNjU1cXMq9MT2bdHvnjvnyiJmfB3e7tw6PtPbeduLX823habg2pu371flHhERHjMzMxERHfMzEQzH9Ibq3q/Vve1eq5UXMXSMXtW9LwJq5ixb576qvKblXETVPuiPCIB5nqXvXXeoO8s7dO4cj1uZlV/Jop7rdi3H4NqiPKmmO6PPxmeZmZeaAAAAAAAAAAAAAAAAAAAAAAAH9iJmeIjmZaW+h70sjpr0vtXtRx/V7g1uKMvUO1TxVap4+92P6MTMzH5VVXuVS9CLpXG/OpMbh1XG9ZoO3qqL9yK4+TfyfG1b98RMTXP6MRP4TRcAAAAAAAAAAAAAAAAAHnepe8NK2FsfVd2axXxi6fYm52Iq4qvVz3UW6fzqqpimPpBWv7IL1U+1uiY/TDRsnjL1CmnJ1eqirvt2Inm3an2TXVHanw+TTHjFajrud77k1TeG7dT3PrV71ufqWRVfvTHhTz4U0+ymmOKYjyiIdMAAAAAAAAAAAAAAAAAAAAAAAAAAAAADnaBpOoa7rmDoulY1WTn51+jHx7VPjXcrmIpj3d8+IJ69BvpXO9+ov3VarjdvQtu103eK6eab+V426O/xinjtz9FMT+E0QeM6K7B0/pp040vaeBNNyvHo7eXfiOPhGRV33Ln0TPdHPhTFMeT2YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADjapn4Ol6ff1HUsuxh4ePRNy9fv3Iot26Y8aqqp7oh4rrL1b2b0q0X4buPO7WZdomcTTrExVk5M+HdT5U8+NU8RHvniJz367dcd5dWNRqp1O/8Aa/Q7dfaxtJxq59VRx4VVz/nK/wA6e6O/iKeQTb6RPpb5OZOTtvpXcuY2N327+uV0dm7c8p9RTP4Efnz8r2RTxEzUTIvXsnIuZGRduXr12ua7ly5VNVVdUzzMzM98zM+b5gAAAAAAAAAAAAAP3Zt3L12i1at1XLldUU0UUxzNUz3RER5yCafQ46YfyjdVrGRqFj1mg6FNGbn8x8m5Vz96sz+lVHMx5001NLEXejD00t9MOlOBpF+1TGs5kRmarXxHPr6oj73z7KI4p9nMTPmlEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABx9TzsPTNOyNR1HKs4mHjW6rt+/erimi3RTHM1VTPdERD6ZN+xi413Jyb1uzYtUTXcuXKoppopiOZqmZ7oiI7+WfXpfekDd6hahd2ftPKqo2ljXI9bepiaatRuUzz2p8/VRMfJp85jtT5RAdD6VvXTM6rbi+1ek13sbaWn3Z+CWavk1ZVyO6b9yP2xTT5RPtmUHAAAAAAAAAAAAAAAAAAAAAAAA5miaZn63rOHo+l41eVnZt+jHx7NHjcuVzEUxH0zLhrgfY+OlfwrOyOqWsY/NnGmvF0amuO6q5xxdvR+jEzRE+2a/OIBaHod0+wemXTXS9qYfYuXrNHrc6/THHwjJq4m5X9HPFMc98U00x5PbgAAAAAAAAAAAAAAAAAoV6ffVSdw7wt9O9IyO1peh3O3n1UVd17M447Pvi3E8fpVVR5QtR6S3U2x0t6XZ2tW7ludYyonF0qzV39q/VE/L486aI5rnyniI/Ghlxk372Tk3cnJu13r12ua7lyurmquqZ5mZmfGZkHzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASn6NXULavTDe93dm4NAzdZzLNibWnU2LlFNNiqvmK7k9r8bs/Jjjyqq9yLAF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNo+O9tX5j61+82lGQF5vjvbV+Y+tfvNp0W+vTYnJ29fx9m7TvYOq3fk0ZWfepuW7MedUUU/hVeyJnjznnwmmwDsdya5rG5NaydZ17UcnUdQyau1eyL9c1V1T/APSI8IiO6I8HXAAAAAAAAAAAAAAAAsh6B/S/7ruotW8tUxu3o23K6blqK6eab2ZPfbp/ofhz7Jij2q9aPp2bq+rYmlabj15ObmXqLGPZojmq5XVMRTTH0zMNWOiGwcHpp010ramJ2K71i36zNv0x/P5NXE3K/o57o9lMUx5A9qAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/N65bs2q7t25Tbt0UzVXXVPEUxHjMz5QXrluzaru3blNu3RTNVddU8RTEeMzPlChfpeekbc3hdydjbGzKre3KKpt52dbnidQmPGimfKz/8/wCj4h+fTA9Iqd6XMjYmycmadt26+znZtE8TqFVM/g0/9VEx/SmOfDxq+AAAAAAAAAAAAAAAAAAAAAAAAAPUdKtl6n1C3/pO0tKiab2deim5d7PMWLUd9y5PuppiZ9/dHjLVzaWgaZtbbOnbd0ax6jT9Ox6bFijz7NMeMz5zPfMz5zMyr36BfSv7ldjV771fG7Or7gtx8FiqPlWcLnmn6JuTxXP5sW/CeVmAAAAAAAAAAAAAAAAAH8qmKaZqqmIiI5mZ8n9V39OTqp9xHTr7ltJyexru4qKrPNFXFWPieFy53eE1c9iPpqmPwQVU9LnqnPU3qjfnT8iqvb+j9rE02In5Nzv++Xv6dUd0/k00IaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHc7J23qe7926ZtnRrXrc/UsimxZifCJnxqq9lNMc1TPlESCzf2Pfph9s9wZXUzVsbnE0yasXS4rjuryJp+Xcj2xRTV2Y99c+dK8joenm1NM2PsrStqaPR2cPTceLVNUxxNyrxqrn86qqaqp98y74AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8M/MxNPwr2dnZNnFxbFE3L169XFFFumO+aqqp7oiPa4u5dc0jbWhZeua9qFjT9Nw7frL+Req4poj/AM5mZ4iIjvmZiI5mWePpP+kNq3VLMu6DonrtN2hZuRNFiZ4uZtVM91y7x4R4TFHhHETPM8cB3XpY+kdkdQLl/Z+zbt7F2tbrmnIyO+m5qUxPdMx402u7mKZ758Z8oitgAAAAAAAAAAAAAAAAAAAAAAAAAJW9Fzphc6o9UsTTcm3VOiYHGXqtceE2qZ7rfPtrn5Pt47U+SK7dFdy5Tbt01V11TEU00xzMzPlDTv0U+l1HS/pbi4eZZinXtT7OZqtXjNNyY+Ta+iimePZ2u1MeIJZs27dm1RatW6bduimKaKKY4imI8IiPKH6AAAAAAAAAAAAAAAAAHB1/VtP0HQ83WtWyaMXAwbFeRkXqvCiimOZn390eHmyn60791DqV1H1Tdmf26KMm52MSxVPPwfHp7rduPLujvnjxqmqfNZ/7IR1Ui3Yx+lejZPy7nYy9aqoq8KfwrVifpni5Me6j2ypcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAux9jz6YfBtPzOqOrY3F3KivD0eK48LcTxdvR75qjsRPspr8qlVOkGx9Q6i9RNJ2lp/apnMvR8IvRHPqLFPfcuT9FPPHtniPNq7t7SNP0DQcHQ9Kx6cfAwMejHx7VPhTRREREf2eIOcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8v1O39tjpzte9uHdOoU4uNRExatU/Ku5Fflbt0+NVU/sjxmYiJl5Pr/1w2p0j0njOrjUdev25qw9Ks3Ii5XHlXcnv9Xb585jme/iJ4njOfqn1D3T1K3Nc17dOoTkXu+mxYo+TZxqOeexbp8o/bM+MzMg9R6QfWzcvVzXe1mVVYGgY1yasDTLdXNNHjEXLk/j3Jjz8I74iI5nmKwAAAAAAAAAAAAAAAAAAAAAAAAAB2W19D1Lcu49P2/o+PORqGoZFGPj2486qp4jn2RHjM+URMgsB6CHSv7r9/Vb11bGivRdvXIqsxXTzTfzOOaKffFEcVz7+x5TLQZ5PpFsfTenPT3StpaZxVRh2vv8Ae44m/eq77lyfpqmeI8o4jyesAAAAAAAAAAAAAAAAAeT6u7403pz091Xdup8VUYdr7xZ54m/eq7rduPpqmOZ8o5nyesZ8+nf1T+7Df9Oy9Jye3ou3blVN6aKuab+Z4V1e/sRzRHsn1nlIK/7n1vUty7iz9f1jJqydQ1C/VkZFyfxqqp5niPKPKI8oiIdaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJH9HHpxf6n9VNN2/NFf2stVfCtUu088UY1Ex2o58pqniiPfVz5Atr6AvS/7mtjXd/arjdnVNwURGJFdPFVnDieYmP/AGkxFXvppolZx8sTHsYmLZxMWzRZsWaKbdq3RHFNFMRxERHlERHD6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6jd+5tB2hoGRr25dUxtM07Hjmu9fq4jnyppjxqqnypjmZ8oB26r3pKelRpe1PhO1+nl3H1XXoibeRqPdXjYVXhMU+V25H+7E+PamJpiGfSO9KLXd9fCdubLqydD21VE27t3ns5WdT59qYn73RP5ETzMc9qZiezFbgc3W9V1LXNWydW1jOyM7Pyrk3L+Rfrmuu5VPnMy4QAAAAAAAAAAAAAAAAAAAAAAAAAAALo/Y9+lcW7GR1U1nG+Xc7eJotNdPhT+Ddvx9M824n3XPbClzXjpriYuB0725h4Vi3Yx7Ol41Nu3RHEUx6qkHoAAAAAAAAAAAAAAAAAfm9ct2bVd27cpt26KZqrrqniKYjxmZ8oBE3pWdUaOl/S3KzMO9FOvan2sPSqfGabkx8q79FFM8+ztdmJ8WYlyuu5cquXKqq66pmaqqp5mZnzlKfpR9T7vVHqlmaljXap0TA5xNKo74j1VM99zj211c1e3jsx5IqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaQehR0w+4HpZb1fUbHY1zcUUZeR2o+Vascc2bXuns1TVMe2uY8oVF9EDph/KT1Xxvh+P63QdF7ObqPaj5Nzifvdmf06o74/JpraZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADqd27l0DaWiXtb3Jq2Lpen2Y+XfyK+zHPlER41VT5UxzM+UKUdffS51jXoyNB6aUX9G0yqJouapcjjLvR5+rj/NR49/fV4T8me4FievfpDbM6WWbun+sp1rcnZ+RpmNcj71PHdN6vvi3Hh3d9U8+HHez/wCrPU/ePU7XZ1TdWp1XqaJn4Nh2uaMfGifK3Rz3fpTzVPHfMvHXrt2/ervXrld27cqmquuuqZqqqmeZmZnxl+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGv+xP8AoRoP/ZuP/wAKlkA1/wBif9CNB/7Nx/8AhUg7kAAAAAAAAAAAAAAABWb09eqf3K7Fo2JpGT2NX3Bbn4VNM/Ks4XPFX0TcmJoj82Lnh3LC7t1/TNrbZ1HcWs3/AFGn6dj1X79fn2aY8Ijzme6IjzmYhlH1V3pqfULf+rbt1WZpvZ16ardrtcxYtR3W7ce6mmIj398+Mg8uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/Vuiu5cpt26aq66piKaaY5mZnyh+VivQV6Yfdn1J+6vVMbt6Ltyqm9EV0803suf5qj39n8OffFHPiC3PotdM6emHSfB0zKsxRrWfxm6rPdMxeqiOLfPsop4p9nMVTHilUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARH1m9ITp70zovYeXqH231yjmmNLwKoruUVey7V+Dajnjnn5Xf3UyCW66qaKJrrqimmmOZmZ4iIVy65elftDZkX9J2bFjdGuU80zct1/5Fj1fnXI/nJj8mju8u1Eqp9a/SE3/1OqvYWVmfafQa54jS8GuaaK4/62v8K74R3T8n2UwiEHqupXUPd/UXWp1Xdus38+7TM+ps89mzYifK3bj5NMd0eHfPHfMvKgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1/wBif9CNB/7Nx/8AhUsgGv8AsT/oRoP/AGbj/wDCpB3IAAAAAAAAAAAAAAPEdceoOD0y6a6puvM7Fy9Zo9Vg2Kp4+EZNXMW6Po55qnjvimmqfIFXvsg/VT4Vn4/S3RsnmzjTRlazVRP4Vzjm1Z/oxPbmPbVR50yp+5mtann61rGZq+qZNzKzs2/XfyL1c81XLlUzNVU/TMuGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADk6XgZmqani6Zp2NcyczLvUWMezbjmq5cqmIppiPbMzENV+hXT/D6ZdMtL2rjerryLVHrc6/RHHr8mvvuV++PCmOfxaaY8lTfsfXTCNY3PldSdWx+1haRVOPpsVx3XMqqPlXI9sUUTx+lXE+NK9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATMRHMzxEIX6r+kt0x2F63Ep1T7odWo5j4Fpc03Ypq9ld3nsU9/dMczVH5IJoRh1b679Oemtu7Z1nWqM3VaOYjTMCYvZHa9lUc8W/6cx7uVK+rXpR9St8xewtOy42vpFyOzONp1cxdrj8+/wB1c+z5PZiY8YlBdUzVVNVUzMzPMzPmCe+svpTdQN9Td0/RL1W1NFq5p9RhXZ+EXaf+svcRV+qnsx38TygSqZqqmqqZmZnmZnzfwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa/7E/6EaD/ANm4/wDwqWQDX/Yn/QjQf+zcf/hUg7kAAAAAAAAAAAAABnR6bvVSN+dSZ29pWT6zQdvVV2Lc0T8m/k+F2574iYiiP0ZmPwlrPTC6p/ya9L7tnTcj1e4db7WJp/Zn5Vqnj77e/o0zERP5VVPvZpzMzPMzzMg/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADt9m7e1Pdm6tM21o1n12fqWTRj2aZ8ImqfwqvZTEczM+URMuoXS+x59MPVY+Z1S1ax8q7FeFo8VR4U88Xr0fTMdiJ91z2gtJ012jpmxNjaTtPSKOMXTseLfb44m7XPfXcn31VTVVP0vRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8ZF6zj2K7+Rdt2bVuO1XXXVFNNMe2ZnwgH7EMdRfSa6S7Oi5Zp177f51ETxjaREX45993mLcd/j8qZj2K1dSfTJ33rXrcXZ2m4W2cWrmIv1RGTlTH6VUdin/dmY9oL07l3BoW2dLr1TcOsYOlYVHjfy79Nqjn2RNU98+6O+VceqHpk7M0WLuHsfTMncmXHMRlXonHxKZ9scx26+J8uzTE+VSju59x6/ufU6tT3FrOfq2ZV3euy79V2qI9kcz3R7o7nVAkzqj116mdRZu2Nc3Ddx9Oud06dp/NjG49lVMTzXH6c1IzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABr/ALE/6EaD/wBm4/8AwqWQDX/Yn/QjQf8As3H/AOFSDuQAAAAAAAAAAAHyzcnHwsO/mZl+3j41i3VdvXblUU026KY5qqmZ8IiImeX1VV9P/qp9o9r2em+j5PZ1DWKIu6lVRV32sSJ7rc+cTcqj/dpmJ7qgVZ9I3qVk9UuqGobg7dyNLsz8F0uzV3erx6ZnszMeVVUzNc++rjwiEbgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD1XSbZWo9QuoWkbS02KouZ1+Iu3YjmLNmPlXLk/o0xM++eI8Zau7Y0XTtt7d0/QNIsRj4Gn49GPj248qKY4jn2z3czPnPMq3+gB0wnb2y7/AFB1XH7Opa9TFGDFdPyrWHTPPaj/ANpVHP6NNE+a0IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/ldVNFE111RTTTHMzM8REI/3d1r6U7ViuNZ31o1N2juqsY1/wCE3Yn2TRa7VUfrgEgiq28vTW2Zg+stbW2xq2s3aeYpu5VdOLZn3x+HVMfTTShLevpddWte7drSsjTduY9XMRGDjRXc499d3td/vpikGh2pZ2DpuHczdRzMfDxbcc3L2Rdpt0Ux76pmIhDm+/Si6P7Wiu3a1+vX8qnn7xpFr10T/wB5Mxb4+iqWdO59z7j3PmfDNx69qer5HMzFeblV3pp90dqZ4j3Q6gFrd/empuzPmvH2ZtvT9Fs98RkZlU5V6fZMR8mimfdMVK+776jb631e9ZuzdGparT2u1TZu3ezYpn202qeKKZ+iIeUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGv+xP+hGg/9m4//CpZANf9if8AQjQf+zcf/hUg7kAAAAAAAAAAAHR7+3TpWytm6punWrvq8HTseq9c7+Jrnwpop/OqqmKY98wyi6h7s1XfG9NU3VrNztZuo35u1UxPybdPhTRT+bTTEUx7oWR+yBdVJ1fcdjppo+TM4GlVRf1Sqiruu5Mx8m3PtiimeZ/Oq745ohU8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIXo89Ocjqf1S0zbdNNynT4q+E6leoifvWNRMdvv8AKauYoifbXCPWjfoRdMPuE6W0a7qWP2Nc3FFGVe7VPFVnH45s2/dPEzXPvr4n8EE74OLjYOFYwsOxbsY2PbptWbVunimiimOKaYjyiIiIfYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB+L121ZtVXb1yi3bp8aq6oiI/XLz+p792LpczGp7025gzHj8I1Szb47+Pxqo8wejEXat6QnRjTImcnqDpVzj/RouZH/AAqanj9a9L7o5gdr4Lla3qvHh8E06aefo9bNALAipGtenBt612vtLsPVMz8n4Xm28f8Ab2abnveE1z02d95ETTo21dvYET55E3ciqPo4qojnw8gXyGZ+velF1r1btURu2nT7Uzz2MLCs2+P6XZmv+1He4d+743DTVTru8Nf1OiqOJoytQu3KOPZ2Zq4493ANUNyb+2PtuK/t/u/QtMqo7poyc+3RXz7IpmeZn3RCMtz+lZ0Y0Xt02Ney9Zu0d029Owq6ufoqriiif1VM2AF1d0enBg0dq3tjYeRe5/Bvajm02+Ppt0RVz/vwijdXpcdYdZ7dOBnaXoNqruinAwqaqoj9K7Nc8++OPdwgEB6Lde+t57rrmdybq1nVon8TKzK66I+iiZ7Mfqh50AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGv+xP+hGg/9m4//CpZANf9if8AQjQf+zcf/hUg7kAAAAAAAAABHnpD9ScXpb0x1DcVc269Rrj4Npliqf53Jqiez3edNPE1z7qZjzhIbP37IZuHVc7rFi7dv5H/AKN0vT7dzGs090RXd76659szxTH0Ux7+QrhqGXlahn5Gfm37mRlZN2q9eu3J5quV1TM1VTPnMzMy+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmH0SemP8pnVfFsZ1jt6FpMRm6nMx8mumJ+Ra/p1d0x+TFfsabxERHERxEKQ+iZvPN2X0v7Gj6ZplVzPy7l7Jv37ddVy5NM9imOYrjuiI7o485nzlL/8tW6f9A0b/wCDd/iAn8VW3V6R299K1OMXH0rbtVE24r5uY96Z5mZ9l2PY6n40G/v/AMI2z+7X/wCMC34pxqfpT9QcbTsnJt6Ptea7VmuumKsa/wATMRM9/wB+eH+Or1T/APwDZn7nk/8A9QC/4oB8dXqn/wDgGzP3PJ//AKhxbnpl9Wq7lVVOFte3EzzFNODd4j3RzdmQaEjPT45PVz/Rts/uNz+I42R6YHWK7c7VF7QbEcfgUafzH/iqmf7QaKDOf43vWT/TdF/q6n+9xsj0tOtV252qNc06xHH4FGmWZj/xRM/2g0hGbXxsOtvzjwv6ssf4XFu+lN10ruVVU71ptxM91FOlYfEfttTP9oNLxmZV6UXXWqmaZ31PExx3aVhR/wDoXE+Mj1t+f2b+7Y/8MGnwy7yfSJ61ZFEU3OoGpUxE8/e7dqif200Q+H8v3WX/AFhaz/v0/wBwNSxlTd63dXblyqurqNuSJqnmeznV0x+qIniHxyOsvVm/b7FfUjdcRzz971S9RP7aaokGrgya/lY6p/6y95/17k/43Dq6idQKqpqq31ueZmeZmdWv9/8A4ga4jIbJ3rvLJrivJ3br96qI4ibmo3qpiP11ONkbl3HkW/V5G4NWvUc89mvMuVR+yZBsEMc69U1OuiaK9RzKqao4mJv1TEx+1wwbGVapplNU01ajhxMTxMTfp7v7XEu7o2zauVW7u4tIt10zxVTVm24mP1csfgGut/fuxrF2bV/ee3LVynxpr1SzEx+qanCv9U+mNi7Nq/1G2fauU+NNet40TH6prZLgNXL/AFm6S2bs26+pG1ZqjxmjU7VcftiqYlwbvXro5auVW6uoehzNM8TNN6ao/bEcSyxAagXPSP6JUVVU1b+wZmmZiezj35/ZxR3uvu+lN0Lot1VU71quTEd1NOlZnM/ttRH9rM8BpBk+lr0VtURVb1vUsiZnjs29NuxMe/5UQ4GT6YnSC1cim3G4b8THPat4FMRHu+VXEs7gF/8AI9NXpdR6yLOg7vu1U8xTPwTHppq/X6/mI/V+p1uV6bmyqYp+DbO3Bcn8b1lyzRx9HFU8qJALs5Xpx6TT2/gvTvNu8fges1SmjtfTxbnj+11eT6cuZVVHwbprYtxx3xc1ma+f2WYU6AWuyvTd3jVRxi7L0G1Vz43L12uOPZxEx3upzfTT6pXe3Tj6JtLGpmfkzGJfqqiPpm9xP7FZwE/5vpedZcjteqztGxO1Mcep06mez9Hbmr+10md6T/XHK5id71WaJnmKbOnYtHH64t8/2obASPnddusOZz67qJr9PMzP3nJ9V4/ocf8A9nn9Q6idQNQiYz99bny4mIifX6tfr8PDxqeYAffMzMvNuetzMq/k19/yrtya57/Hvl8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//Z`}
                  alt="Brigzard Logo"
                  className="mw-logo"
                  style={{ height: 42 }}
                />
                <div className="mw-live">
                  <div className="mw-live-dot" />
                  <span className="mw-live-text">LIVE</span>
                </div>
              </div>

              <div className="mw-hero-name-block">
                <span className="mw-tag-line">▸ Fire Support</span>
                <div>
                  <div className="mw-name">BRIGZARD</div>
                </div>
                {showGreeting ? (
                  <div className="mw-greeting" key={formData.name}>
                    <span style={{ fontSize: 10 }}>🎖️</span>
                    <span className="mw-greeting-text">Operator: {formData.name.trim()}</span>
                  </div>
                ) : (
                  <div className="mw-sub-tag">Fire · Support · Dominate</div>
                )}
              </div>
            </div>

            {/* COMMAND BAR */}
            <div className="mw-cmdbar">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="mw-rank-badge">GENERAL</div>
                <div className="mw-fleet-name">Brigzard Force</div>
              </div>
              <div className="mw-xp-wrap">
                <div className="mw-xp-label">FLEET XP</div>
                <div className="mw-xp-bar"><div className="mw-xp-fill" /></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mw-body">

                {/* CALLSIGN */}
                <div>
                  <label className="mw-lbl">▸ Operator Callsign</label>
                  <div className="mw-iw">
                    <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required />
                  </div>
                </div>

                {/* MISSION TYPE */}
                <div>
                  <label className="mw-lbl">▸ Objective</label>
                  <div className="mw-types">
                    {TYPES.map((t) => (
                      <button
                        key={t.key} type="button"
                        onClick={() => handleDonationTypeChange(t.key)}
                        className={cn("mw-tb", donationType === t.key ? "mw-on" : "")}
                      >
                        <div className="mw-tb-face">
                          <span className="mw-tb-emoji">{t.emoji}</span>
                          <span className="mw-tb-name">{t.label}</span>
                          <span className="mw-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DEPLOY CREDITS */}
                <div>
                  <label className="mw-lbl">▸ Deploy Credits</label>
                  <div className="mw-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="mw-cur">
                          <span>{currencySymbol} {selectedCurrency}</span>
                          <ChevronsUpDown style={{ width: 10, height: 10, opacity: 0.3, marginLeft: "auto", flexShrink: 0 }} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[220px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search currency..." />
                          <CommandList>
                            <CommandEmpty>No currency found.</CommandEmpty>
                            <CommandGroup>
                              {SUPPORTED_CURRENCIES.map((c) => (
                                <CommandItem key={c.code} value={c.code} onSelect={() => { setSelectedCurrency(c.code); setCurrencyOpen(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", selectedCurrency === c.code ? "opacity-100" : "opacity-0")} />
                                  {c.symbol} {c.code}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="mw-iw" style={{ flex: 1 }}>
                      <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange} min="1" placeholder="0" required />
                    </div>
                  </div>
                  {pricing.ttsEnabled && (
                    <p className="mw-hint">⚡ TTS ENABLED ABOVE {currencySymbol}{pricing.minTts}</p>
                  )}
                </div>

                {/* RANK TIERS */}
                {currentAmount > 0 && (
                  <div className="mw-fu">
                    <label className="mw-lbl">▸ Rank</label>
                    <div className="mw-tiers">
                      {TIERS.map((tier, i) => (
                        <div
                          key={i}
                          className={cn("mw-tier", i === activeTierIdx ? "mw-tier-active" : i < activeTierIdx ? "mw-tier-done" : "")}
                        >
                          <span className="mw-tier-emoji">{tier.emoji}</span>
                          <div className="mw-tier-rank">{tier.rank}</div>
                          <div className="mw-tier-amt">
                            {i < activeTierIdx ? "✓" : i === activeTierIdx ? `${currencySymbol}${tier.min}+` : `${currencySymbol}${tier.min}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mw-div" />

                {/* TEXT */}
                {donationType === "text" && (
                  <div className="mw-fu">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <label className="mw-lbl" style={{ margin: 0 }}>▸ Intel Message</label>
                      <span style={{ fontSize: 9, fontWeight: 700, color: msgClr, fontFamily: "var(--mw-font)", letterSpacing: "0.1em" }}>
                        {formData.message.length}/{maxMessageLength}
                      </span>
                    </div>
                    <textarea
                      name="message" value={formData.message} onChange={handleInputChange}
                      placeholder="Your message (optional)" className="mw-ta" rows={2} maxLength={maxMessageLength}
                    />
                    <div className="mw-cbar">
                      <div className="mw-cbar-fill" style={{ width: `${msgPct}%`, background: msgClr }} />
                    </div>
                  </div>
                )}

                {/* VOICE */}
                {donationType === "voice" && (
                  <div className="mw-fu">
                    <label className="mw-lbl">▸ Voice Comms</label>
                    <div className="mw-sp">
                      <EnhancedVoiceRecorder
                        controller={voiceRecorder} onRecordingComplete={() => {}}
                        maxDurationSeconds={getVoiceDuration(currentAmount)}
                        requiredAmount={pricing.minVoice} currentAmount={currentAmount} brandColor="#141414"
                      />
                    </div>
                  </div>
                )}

                {/* HYPERSOUND */}
                {donationType === "hypersound" && (
                  <div className="mw-fu mw-sp">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13 }}>🔊</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "var(--mw-font)", letterSpacing: "0.15em" }}>HYPERSOUNDS</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
                  </div>
                )}

                {/* MEDIA */}
                {donationType === "media" && (
                  <div className="mw-fu mw-sp">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13 }}>🖼️</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "var(--mw-font)", letterSpacing: "0.15em" }}>MEDIA DROP</span>
                    </div>
                    <MediaUploader
                      streamerSlug="brigzard"
                      onMediaUploaded={(url, type) => { setMediaUrl(url); setMediaType(type); }}
                      onMediaRemoved={() => { setMediaUrl(null); setMediaType(null); }}
                    />
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency} />

                {/* DEPLOY BUTTON */}
                <div className="mw-btn-wrap">
                  <button type="submit" className="mw-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                        <span className="mw-spin" /> DEPLOYING...
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                        ▸ DEPLOY {currencySymbol}{formData.amount || "0"} CREDITS
                      </span>
                    )}
                  </button>
                </div>

                <p style={{
                  fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.12)",
                  textAlign: "center", lineHeight: 1.6, fontFamily: "var(--mw-font)", letterSpacing: "0.06em",
                }}>
                  PHONE NUMBERS COLLECTED BY RAZORPAY PER RBI REGULATIONS
                </p>
                <DonationPageFooter brandColor="#141414" />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Brigzard;
