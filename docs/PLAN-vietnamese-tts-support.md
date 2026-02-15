# Plan: Vietnamese TTS Support

> **Status**: ✅ COMPLETED
> **Owner**: Frontend Specialist
> **Goal**: Ensure Text-to-Speech (TTS) supports Vietnamese optimally and allows user customization.

## ✅ Completed Implementation

### Phase 1: Voice Selection Logic Enhancement

- **File**: `frontend/src/hooks/useTextToSpeech.ts`
- **Changes**:
  - Added priority list for Vietnamese voices:
    1. "Google Tiếng Việt"
    2. "Microsoft An Online"
    3. "Microsoft HoaiMy Online"
    4. "Linh"
  - Exact match `vi-VN` is prioritized before loose `vi` match.
  - Console logs when voice is selected for debugging.

### Phase 2: User Interface for Voice Settings

- **File**: `frontend/src/pages/MockDefensePage.tsx`
- **Changes**:
  - Added Settings button (gear icon) in header.
  - Created Voice Settings Modal with:
    - Dropdown for Vietnamese voice selection.
    - Slider for speech rate (0.5x - 2x).
    - "Nghe thử" (Test) button.

### Phase 3: API Enhancements

- **File**: `frontend/src/hooks/useTextToSpeech.ts`
- **New exports**:
  - `selectedVoice: SpeechSynthesisVoice | null` - Current voice.
  - `currentRate: number` - Current speech rate.
  - `setVoice(name: string)` - Change voice by name.
  - `setRate(rate: number)` - Change speech rate.

## Verification Checklist

- [x] Auto-select "Google Tiếng Việt" if available.
- [x] User can manually change voice in UI.
- [x] Speech rate can be adjusted.
- [x] Test button works.
