# Google Analytics 4 — Complete Setup Guide
# Strictly Desserts (strictlydesserts.in)

---

## 1. Files Created

| File | Purpose |
|------|---------|
| lib/analytics.ts | Core GA4 utility — trackEvent(), trackPageView(), and all named event helpers |
| components/GoogleAnalytics.tsx | Script loader + auto route-change tracking + scroll depth + outbound links |
| hooks/useAnalytics.ts | React hook — use in any client component |

## 2. Files Modified

| File | Change |
|------|--------|
| app/layout.tsx | Added import GoogleAnalytics + component inside body |
| components/Storefront.tsx | Added import analytics + 8 event tracking calls |

---

## 3. Environment Variable (REQUIRED)

Add this to Vercel → Settings → Environment Variables:

Key: NEXT_PUBLIC_GA_MEASUREMENT_ID
Value: G-XXXXXXXXXX (replace with your Measurement ID)
Environment: Production + Preview + Development

Also add to .env.local for local dev:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

NEVER commit .env.local to GitHub.

---

## 4. How to Get Your GA4 Measurement ID

1. Go to analytics.google.com
2. Admin → Data Streams → Select your web stream
3. Copy the Measurement ID (format: G-XXXXXXXXXX)

---

## 5. Deployment Steps

1. Add NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel Settings → Environment Variables
2. Redeploy: Vercel Dashboard → Deployments → Redeploy
3. Visit your site and open DevTools → Network → filter "googletagmanager"
4. Verify requests appear to googletagmanager.com

---

## 6. Events Automatically Tracked

Built into GoogleAnalytics.tsx (zero extra code):
- page_view — every route change
- scroll_depth — at 25%, 50%, 75%, 100%
- outbound_link_click — any external link click

Wired into Storefront.tsx:
- nav_click — navigation menu item clicked
- order_now_click — WhatsApp cart order placed
- cake_category_click — category card clicked
- view_item — product quick-view opened
- contact_form_submit — Customise Your Cake form sent
- whatsapp_click — WhatsApp FAB clicked
- instagram_click — Instagram footer link clicked

---

## 7. GA4 Reports

Real-Time Visitors: Reports → Real-time
Total Visitors + Page Views: Reports → Engagement → Pages and screens
New vs Returning: Reports → Retention
Session Duration: Reports → Engagement → Overview
City/State/Country: Reports → User → Demographic details
Device/Browser/OS: Reports → Tech → Tech details
Traffic Source: Reports → Acquisition → Traffic acquisition
Most Viewed Pages: Reports → Engagement → Pages and screens (sort by Views)

---

## 8. Custom Events Report

Reports → Engagement → Events
All custom events appear automatically within 24h.
Use Real-time → Events for immediate verification.

---

## 9. Campaign Tracking (UTM)

Add to any link you share:
https://www.strictlydesserts.in/?utm_source=instagram&utm_medium=social&utm_campaign=birthday-june

View in: Reports → Acquisition → Traffic acquisition

---

## 10. Adding Future Custom Events

Option A — Hook in any client component:

import { useAnalytics } from "@/hooks/useAnalytics";
const { trackEvent } = useAnalytics();
trackEvent({ event_name: "my_event", category: "Cat", label: "Label" });

Option B — Named helper in lib/analytics.ts:

myEvent: (label: string) =>
  trackEvent({ event_name: 'my_event', category: 'Category', label }),

---

## 11. Verification Checklist

- [ ] NEXT_PUBLIC_GA_MEASUREMENT_ID set in Vercel
- [ ] Redeployed after setting the env var
- [ ] Network tab shows googletagmanager.com requests
- [ ] GA4 Real-time shows you as 1 active user
- [ ] nav_click fires when clicking nav items
- [ ] view_item fires when clicking a product
- [ ] scroll_depth fires at 100%
- [ ] whatsapp_click fires on WhatsApp FAB
- [ ] contact_form_submit fires on Customise form

---

## 12. Troubleshooting

GA4 shows no data:
- Check env var is set AND you redeployed after setting it
- Disable ad blocker for testing
- Standard reports have 24h delay — use Real-time to verify immediately

Real-time shows 0 users:
- Network tab: no googletagmanager requests = env var missing or wrong
- Console: window.gtag should be a function (type it in DevTools Console)

Events not in reports:
- New event names take up to 24h to appear in Events report
- Use Real-time → Events for instant confirmation

---

## 13. Architecture

app/layout.tsx
  GoogleAnalytics component (loads once on every page)
    Script: gtag.js (afterInteractive — non-blocking, no SEO impact)
    Script: ga-init (initialises dataLayer)
    GARouteTracker (Suspense-wrapped)
      trackPageView on every route change
      outbound link click tracking (global delegation)
      scroll depth 25/50/75/100% (passive listener)

lib/analytics.ts (pure TS, no React dependency)
  GA_MEASUREMENT_ID from env var
  trackPageView()
  trackEvent() — generic, any parameters
  analytics.{navClick|productView|...} — typed helpers

hooks/useAnalytics.ts
  useAnalytics() — spreads all helpers into a hook

components/Storefront.tsx — 8 events wired:
  go() → navClick
  openQuick() → productView
  goCategory() → cakeCategoryClick
  placeOrder() → orderNowClick
  send() → contactFormSubmit
  Instagram link → instagramClick
  WhatsApp FAB → whatsappClick
