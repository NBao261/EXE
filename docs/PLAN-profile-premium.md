# Profile & Premium Features Plan

## Goal

Implement comprehensive user profile management and refine the premium upgrade experience.

## User Review Required

> [!NOTE]
> **Assumptions**:
>
> - "Update Info" currently implies updating **Name**. Email update is excluded for now (requires verification flow).
> - "Change Password" requires **Current Password** for security.
> - "Hide Premium" means replacing the payment options with a "You are Premium" status card on the Upgrade page.

## Proposed Changes

### Backend

#### [MODIFY] [auth.service.ts](file:///c:/Users/Admin/Desktop/KI%207/EXE/backend/src/services/auth.service.ts)

- Add `updateProfile(userId, { name })`
- Add `changePassword(userId, oldPassword, newPassword)`

#### [MODIFY] [auth.controller.ts](file:///c:/Users/Admin/Desktop/KI%207/EXE/backend/src/controllers/auth.controller.ts)

- Add `updateProfile` handler
- Add `changePassword` handler

#### [MODIFY] [auth.routes.ts](file:///c:/Users/Admin/Desktop/KI%207/EXE/backend/src/routes/auth.routes.ts)

- `PUT /auth/profile`
- `PUT /auth/password`

### Frontend - Service

#### [MODIFY] [auth.service.ts](file:///c:/Users/Admin/Desktop/KI%207/EXE/frontend/src/services/auth.service.ts)

- Add `updateProfile(name)`
- Add `changePassword(currentPassword, newPassword)`

### Frontend - UI

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/Admin/Desktop/KI%207/EXE/frontend/src/pages/ProfilePage.tsx)

- Display Account Info: Name, Email, Plan (Free/Premium), Expiry Date (if Premium)
- Tab/Section for "Update Information" (Name)
- Tab/Section for "Change Password" (Current, New, Confirm)

#### [MODIFY] [UpgradePage.tsx](file:///c:/Users/Admin/Desktop/KI%207/EXE/frontend/src/pages/UpgradePage.tsx)

- Check `user.plan`
- If Premium: Show "You are Premium" card with expiry date. Hide payment buttons.
- If Free: Show existing payment options.

## Verification Plan

### Manual Verification

1. **Upgrade Flow**:
   - Login as Free user -> Go to Upgrade -> See Payment options.
   - Login as Premium user -> Go to Upgrade -> See "You are Premium".
2. **Profile Display**:
   - Check Name, Email, Plan, Expiry Date are correct.
3. **Update Info**:
   - Change Name -> Save -> Reload -> Name persists.
4. **Change Password**:
   - Change with wrong old password -> Error.
   - Change with correct old password -> Success.
   - Logout -> Login with new password -> Success.
