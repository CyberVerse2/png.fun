# Test Checklist - localStorage Removal

## 🧪 Manual Testing Required

Please test the following scenarios to verify MiniKit session persistence works correctly:

### Test 1: Fresh Authentication ✅

1. Open app in **incognito/private window** (ensures no existing session)
2. App should show onboarding screen
3. Click "Connect World ID"
4. Complete MiniKit authentication
5. **Expected**: You are signed in and can see the app

**Open browser console and verify you see:**

```
[MiniKitProvider] Authentication successful, session data: { ... }
```

---

### Test 2: Page Refresh (Critical Test) 🔴

1. After completing Test 1 (you're signed in)
2. Press **F5** or **Cmd+R** to refresh the page
3. **Expected**: You should remain signed in (NO sign-in modal)
4. **Expected**: Your username and profile picture should still be visible

**Open browser console and verify you see:**

```
[MiniKitProvider] Checking for existing MiniKit session...
[MiniKitProvider] MiniKit.user: { username: "...", ... }
[MiniKitProvider] Found existing MiniKit session: { ... }
```

**If this fails:**

- Check console for `MiniKit.user: undefined`
- This means MiniKit doesn't persist sessions
- We'll need to implement alternative solution

---

### Test 3: Browser Close/Reopen 🔴

1. After signing in (Test 1)
2. **Completely close the browser** (all windows/tabs)
3. Reopen browser
4. Navigate to the app
5. **Expected**: Session should persist (you remain signed in)

**If this fails:**

- MiniKit session doesn't survive browser restart
- This is actually OK - most apps require re-auth after browser restart
- Update documentation accordingly

---

### Test 4: New Tab

1. Sign in (Test 1)
2. Open app in **new tab**
3. **Expected**: Session is shared, you're signed in

---

### Test 5: Navigate Away and Back

1. Sign in (Test 1)
2. Navigate to another website (e.g., google.com)
3. Use browser back button to return to app
4. **Expected**: You remain signed in

---

### Test 6: Submit Photo After Refresh

1. Sign in (Test 1)
2. Refresh page (Test 2)
3. Try to submit a photo (click camera → verify → take photo → send)
4. **Expected**: Submission should work without re-authentication

**Note**: You'll still need to authenticate with wallet for certain actions (this is normal)

---

## 🐛 What to Look For

### Success Indicators ✅

- No sign-in modal on page refresh
- Username/avatar visible after refresh
- Console shows "Found existing MiniKit session"
- All features work after refresh

### Failure Indicators ❌

- Sign-in modal pops up on every refresh
- Console shows "No existing MiniKit session found" after refresh when you were signed in
- `MiniKit.user` is `undefined` after refresh
- User data disappears on refresh

---

## 📝 Report Results

After testing, report:

1. **Which tests passed?** (✅)
2. **Which tests failed?** (❌)
3. **Console logs** (copy relevant output)
4. **Browser used** (Chrome, Safari, Firefox, etc.)

If Test 2 (Page Refresh) **fails**, we need to implement an alternative solution (server-side sessions or JWT).

If Test 2 (Page Refresh) **passes**, localStorage removal is successful! 🎉

---

## 🔄 Rollback Plan (If Needed)

If MiniKit sessions don't persist, we can:

**Option A**: Revert to localStorage (quick fix)

```bash
git revert HEAD
```

**Option B**: Implement server-side sessions (better, more secure)

- Add session token to HTTP-only cookie
- Validate on server
- More secure than localStorage

**Recommendation**: Test first, then decide!
