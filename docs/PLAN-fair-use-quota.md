# Fair Use Quota Implementation Plan

## Goal

Implement a "Fair Use" policy for file uploads to prevent abuse while maintaining a "practically unlimited" experience for Premium users.

## Policy Details

- **Free Users**: 5 uploads / all times
- **Premium Users**: 100 uploads / day (Soft Limit)
- **Reset Mechanism**: Quota resets automatically at 00:00 local time (based on `lastUploadDate` check).

## Proposed Changes

### Backend

#### [MODIFY] [quota.middleware.ts](file:///c:/Users/Admin/Desktop/KI%207/EXE/backend/src/middlewares/quota.middleware.ts)

- Implement "Lazy Reset" logic:
  - When a user makes a request, check `lastUploadDate`.
  - If `lastUploadDate` is not today (different calendar day) -> Reset `uploadCount` to 0.
- Update Limit Config:
  - `FREE_LIMIT = 5`
  - `PREMIUM_LIMIT = 100` (instead of Infinity)
- Return `limit` and `remaining` in the `req.userQuota` object.

#### [MODIFY] [auth.types.ts](file:///c:/Users/Admin/Desktop/KI%207/EXE/backend/src/types/auth.types.ts)

- Add `lastUploadDate?: Date` to `User` interface.

### Frontend

#### [MODIFY] [Header.tsx](file:///c:/Users/Admin/Desktop/KI%207/EXE/frontend/src/components/Header.tsx)

- Update tooltip/display to show "Daily Limit" context (e.g., "Used 12/100 today").

#### [MODIFY] [UpgradePage.tsx](file:///c:/Users/Admin/Desktop/KI%207/EXE/frontend/src/pages/UpgradePage.tsx)

- Update text from "Không giới hạn" to "Lên tới 100 tài liệu/ngày" (or keep generic "Upload thoải mái" but technically limited).

## Verification Plan

1. **Free User Test**:
   - Upload 5 files -> Success.
   - Upload 6th file -> Blocked (403 Forbidden).
2. **Premium User Test**:
   - Set `uploadCount` to 99 -> Upload -> Success.
   - Set `uploadCount` to 100 -> Upload -> Blocked.
3. **Reset Logic Test**:
   - Manually set `lastUploadDate` to yesterday.
   - Request upload -> `uploadCount` resets to 0 -> Success.
