# R2 Environment Variables Checklist

## Required Variables

Make sure these are set in your `.env.local` (local) or Vercel environment variables (production):

### 1. R2_ENDPOINT (Recommended)
```
R2_ENDPOINT=https://cbfc3a0c510c1bdddb98a5a16b678886.r2.cloudflarestorage.com
```

**Format:** `https://<32-character-account-id>.r2.cloudflarestorage.com`

**How to find:**
- Go to Cloudflare Dashboard → R2
- Your Account ID is shown in the R2 dashboard URL or settings
- Construct: `https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com`

**OR use R2_ACCOUNT_ID instead:**
```
R2_ACCOUNT_ID=cbfc3a0c510c1bdddb98a5a16b678886
```
The endpoint will be auto-constructed from this.

### 2. R2_ACCESS_KEY_ID
```
R2_ACCESS_KEY_ID=your_access_key_id_here
```

**How to get:**
- Cloudflare Dashboard → R2 → Manage R2 API Tokens
- Create a new token with "Object Read & Write" permissions
- Copy the "Access Key ID"

### 3. R2_SECRET_ACCESS_KEY
```
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
```

**How to get:**
- Same as above - copy the "Secret Access Key"
- ⚠️ **Important:** Save this immediately - you won't see it again!

### 4. R2_BUCKET_NAME
```
R2_BUCKET_NAME=k-vault
```

**How to find:**
- Cloudflare Dashboard → R2
- Your bucket name (e.g., `k-vault`)

### 5. R2_USE_PATH_STYLE (Optional)
```
R2_USE_PATH_STYLE=true
```

**When to use:**
- Set to `true` if you're experiencing SSL handshake errors
- Default is `false` (virtual-hosted style)

## Verification

### Check your endpoint format:
✅ Correct: `https://cbfc3a0c510c1bdddb98a5a16b678886.r2.cloudflarestorage.com`
❌ Wrong: `https://cbfc3a0c510c1bdddb98a5a16b678886.r2.cloudflarestorage.com/`
❌ Wrong: `cbfc3a0c510c1bdddb98a5a16b678886.r2.cloudflarestorage.com`
❌ Wrong: `http://cbfc3a0c510c1bdddb98a5a16b678886.r2.cloudflarestorage.com`

### Test your configuration:

#### 1. Basic R2 Connection Test
Visit `/api/test-r2` in your browser - it should show:
```json
{
  "success": true,
  "message": "R2 connection successful",
  "bucket": "k-vault",
  "endpoint": "https://..."
}
```

#### 2. SSL/TLS Diagnostics Test
Visit `/api/test-r2-ssl` in your browser - this will check:
- Node.js version compatibility
- HTTPS connection to R2 endpoint
- SSL/TLS certificate validation
- R2 SDK connection

### Check Node.js Version
```bash
node -v
```
**Recommended:** Node.js 18.x or 20.x (avoid Node.js 23+ for now due to SSL compatibility issues)

### Verify SSL/TLS Configuration
```bash
echo $NODE_TLS_REJECT_UNAUTHORIZED
```
**Should be:** `1` or unset (default). Never set to `0` in production.

## Common Issues

### SSL Handshake Failure
**Symptoms:** `EPROTO`, `SSL alert handshake failure`, `SSL alert number 40`

**Solutions:**
1. **Check Node.js version:**
   ```bash
   node -v
   ```
   - ✅ Use Node.js 18.x or 20.x (recommended)
   - ⚠️ Node.js 23+ may have compatibility issues
   - ❌ Node.js < 16 is not supported

2. **Try path-style addressing:**
   ```
   R2_USE_PATH_STYLE=true
   ```

3. **Verify SSL certificate validation:**
   ```bash
   # Should be 1 or unset (never 0 in production)
   echo $NODE_TLS_REJECT_UNAUTHORIZED
   ```

4. **Test direct HTTPS connection:**
   ```bash
   curl -v https://cbfc3a0c510c1bdddb98a5a16b678886.r2.cloudflarestorage.com
   ```

5. **Use SSL diagnostics endpoint:**
   - Visit `/api/test-r2-ssl` for detailed SSL/TLS diagnostics

6. **For local development with Node.js 23+:**
   - Consider using `nvm` to switch to Node.js 20:
     ```bash
     nvm install 20
     nvm use 20
     ```

### "Bucket not found"
- Verify `R2_BUCKET_NAME` matches exactly (case-sensitive)
- Check bucket exists in Cloudflare dashboard

### "Authentication failed"
- Verify `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are correct
- Check API token has "Object Read & Write" permissions
- Make sure there are no extra spaces in the values

## Your Current Configuration

Based on your `.env` file:
- ✅ `R2_ENDPOINT` is set: `https://cbfc3a0c510c1bdddb98a5a16b678886.r2.cloudflarestorage.com`
- ✅ Format looks correct (32-char account ID, proper domain)
- ✅ Uses `https://` protocol
- ✅ No trailing slash

## ⚠️ IMPORTANT: Node.js Version Issue

**If you're seeing SSL handshake failures in production:**

Your production environment is using **Node.js v24.13.0**, which has known SSL/TLS compatibility issues with Cloudflare R2.

### Fix for Vercel:

1. **Set Node.js version in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → General
   - Under "Node.js Version", select **20.x** (or 18.x)
   - Redeploy your application

2. **Or use `vercel.json` (already configured):**
   - The `vercel.json` file now specifies `"nodeVersion": "20.x"`
   - Redeploy to apply the change

3. **Verify after deployment:**
   - Visit `/api/test-r2-ssl` again
   - Check that `nodeVersion` shows `v20.x.x` or `v18.x.x`
   - SSL connection should work

**Next steps:**
1. Update Node.js version in Vercel to 20.x
2. Redeploy your application
3. Test with `/api/test-r2-ssl` endpoint
4. Verify all other variables are set (ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME)
