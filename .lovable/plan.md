

## Fix: Update OBS Media Source Network Buffering Instruction

### Problem

The current instruction in `MediaSourcePlayer.tsx` says to set "Network Buffering" to "100-500 MB", but the user wants to update this to recommend a minimum value of 2 MB (not 0, as setting it to 0 crashes OBS).

### Change

**File:** `src/components/audio-player/MediaSourcePlayer.tsx` (line 193)

Update the network buffering instruction from:

```
Set "Network Buffering" to 100-500 MB
```

To:

```
Set "Network Buffering" to 2 MB or above (do NOT set to 0 — it will crash OBS)
```

### No Other Changes

- Single line text update
- No logic, backend, or database changes needed

