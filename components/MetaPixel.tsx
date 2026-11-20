'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Meta Pixel ID — "Strictly Desserts Website" in Meta Events Manager. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1553684699930385';

/** Sends a PageView to Meta on client-side route changes (the first one is sent by the base code). */
function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return null;
}

export default function MetaPixel() {
  if (!META_PIXEL_ID) return null;
  const id = META_PIXEL_ID;
  const baseCode =
    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;" +
    "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;" +
    "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}" +
    "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
    "fbq('init','" + id + "');fbq('track','PageView');";

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {baseCode}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={"https://www.facebook.com/tr?id=" + id + "&ev=PageView&noscript=1"}
        />
      </noscript>
      <MetaPixelRouteTracker />
    </>
  );
}
