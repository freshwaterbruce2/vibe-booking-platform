# 🧪 MANUAL PRODUCTION VERIFICATION GUIDE

## **STEP-BY-STEP MANUAL TESTING** (if you prefer manual checking)

### **PHASE 1: Basic Site Loading (2 minutes)**

1. **Open vibehotelbookings.com** in Chrome/Edge
2. **Press F12** to open Developer Tools
3. **Click on "Console" tab**
4. **Refresh the page** (Ctrl+R)

**✅ SUCCESS INDICATORS:**

- Site loads completely
- No red errors about "refused to load"
- No errors mentioning "Content Security Policy"

**❌ FAILURE INDICATORS:**

- Red errors like: `"Refused to load 'https://web.squarecdn.com/v1/square.js'"`
- CSP violation errors
- Site doesn't load properly

### **PHASE 2: Square SDK Verification (3 minutes)**

1. **In the Console tab**, type this command and press Enter:

   ```javascript
   typeof window.Square;
   ```

2. **Expected result:** Should show `"object"` or `"function"` (not `"undefined"`)

3. **If Square is available, test methods:**

   ```javascript
   Object.keys(window.Square || {});
   ```

   **Expected:** Should show `["errors", "payments"]` or similar

4. **Test Square payments function:**
   ```javascript
   typeof window.Square?.payments;
   ```
   **Expected:** Should show `"function"`

### **PHASE 3: Navigation Testing (3 minutes)**

1. **Navigate around your site:**
   - Click "Book Now" or search buttons
   - Go to booking/payment pages
   - Watch the Console tab for new errors

2. **Look for payment forms:**
   - Credit card input fields
   - Payment buttons
   - Square payment elements

3. **Monitor console during navigation:**
   - Should NOT see "refused to load" errors
   - May see warnings (these are OK)
   - Should NOT see blocking errors

### **PHASE 4: Network Tab Verification (2 minutes)**

1. **Click "Network" tab** in Developer Tools
2. **Filter by "square"** (type "square" in filter box)
3. **Refresh page and navigate**
4. **Look for:**
   - ✅ Requests to `web.squarecdn.com` with status 200
   - ✅ Requests to `js.squareup.com` loading successfully
   - ❌ Should NOT see failed/blocked requests

## **🎯 SUCCESS CRITERIA CHECKLIST**

**Check each item:**

- [ ] Site loads without CSP errors
- [ ] `typeof window.Square` returns `"object"` (not `"undefined"`)
- [ ] Navigation works without blocking errors
- [ ] Square network requests load successfully
- [ ] Payment forms appear (if on payment pages)

## **❌ COMMON ISSUES & SOLUTIONS**

### **If you still see CSP errors:**

```
"Refused to load 'https://web.squarecdn.com/v1/square.js'"
```

**Solution:** The backend CSP fix may not be applied. Upload `production-security-middleware.js` to your server.

### **If Square SDK not available:**

```javascript
typeof window.Square; // returns "undefined"
```

**Solution:** CSP is still blocking. Check Network tab for failed square requests.

### **If site broken after upload:**

**Solution:** Clear browser cache (Ctrl+Shift+R) and try again.

## **⚠️ IMPORTANT NOTES**

**These are NORMAL and OK:**

- Report-only CSP warnings
- Meta tag delivery warnings
- Some non-critical console warnings

**These are PROBLEMS that need fixing:**

- "Refused to load" errors
- "blocked by Content Security Policy"
- "TypeError" related to Square/payments
- Site not loading at all

## **🆘 IF PROBLEMS PERSIST**

1. **Take screenshot** of console errors
2. **Copy exact error messages**
3. **Report back** - I can create additional fixes

The automated tests will run first to check everything automatically!
