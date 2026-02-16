# MongoDB Atlas DNS (SRV) Fix For Local Dev

This project connects to MongoDB using `MONGODB_URI` (see `lib/mongodb.ts`). The error

`querySrv ECONNREFUSED _mongodb._tcp.cluster0.fskvubf.mongodb.net`

means your machine cannot resolve the Atlas SRV DNS record. Vercel resolves it fine, but your local DNS does not.

Use one of the fixes below. The recommended path is to switch local DNS to a public resolver and flush DNS. If that still fails, use a **standard (non-SRV) connection string**.

## Option A (Recommended): Fix Local DNS
1. Change your DNS servers to a public resolver:
   - Cloudflare: `1.1.1.1`, `1.0.0.1`
   - Google: `8.8.8.8`, `8.8.4.4`
2. Flush DNS cache (PowerShell as Admin):
   ```powershell
   ipconfig /flushdns
   ```
3. Test SRV lookup:
   ```powershell
   Resolve-DnsName -Type SRV _mongodb._tcp.cluster0.fskvubf.mongodb.net
   ```
4. Restart the dev server.

If the SRV lookup still fails, proceed to Option B.

## Option B: Use a Standard (Non-SRV) Atlas Connection String
SRV uses special DNS records. A standard connection string avoids SRV DNS lookups.

1. In Atlas, go to your cluster:
   - Click `Connect` -> `Drivers`.
   - Choose the **Standard connection string** (not the SRV one).
2. Replace `MONGODB_URI` in `.env.local` with the standard string.

Example format:
```
MONGODB_URI=mongodb://<user>:<pass>@<host1>:27017,<host2>:27017,<host3>:27017/<db>?replicaSet=<replica>&tls=true&authSource=admin
```

3. Restart the dev server.

## Option C: Network/Firewall/VPN Checks
If DNS works but connections still fail:
1. Disable VPN or corporate proxy (they often block SRV or Atlas traffic).
2. Ensure your IP is allowlisted in Atlas:
   - Atlas -> Network Access -> Add IP Address -> `0.0.0.0/0` (temporary) or your current IP.
3. Make sure port `27017` is not blocked by local firewall.

## Notes
- This is a local-only fix. Vercel does not need changes.
- Keep `MONGODB_URI` in `.env.local` and do not commit it.
- If you switch to standard connection string for local, production can still use SRV.
