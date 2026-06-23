'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { GA_MEASUREMENT_ID, trackPageView, analytics } from '@/lib/analytics';

function GARouteTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

  useEffect(() => {
        if (!GA_MEASUREMENT_ID) return;
        const url = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
        trackPageView(url);
  }, [pathname, searchParams]);

  useEffect(() => {
        const handleClick = (e: MouseEvent) => {
                const target = (e.target as HTMLElement).closest('a');
                if (!target) return;
                const href = target.getAttribute('href') ?? '';
                if (href.startsWith('http') && !href.includes('strictlydesserts.in')) {
                          analytics.outboundLinkClick(href);
                }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
        const milestones = new Set<number>();
        const handleScroll = () => {
                const scrolled = window.scrollY + window.innerHeight;
                const total = document.documentElement.scrollHeight;
                const pct = Math.round((scrolled / total) * 100);
                ([25, 50, 75, 100] as const).forEach((m) => {
                          if (pct >= m && !milestones.has(m)) {
                                      milestones.add(m);
                                      analytics.scrollDepth(m);
                          }
                });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return null;
}

export default function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) return null;
    const id = GA_MEASUREMENT_ID;
    return (
          <>
                <Script
                          src={"https://www.googletagmanager.com/gtag/js?id=" + id}
                          strategy="afterInteractive"
                        />
                <Script id="ga-init" strategy="afterInteractive">{"window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + id + "');"}</Script>
                <Suspense fallback={null}>
                        <GARouteTracker />
                </Suspense>
          </>>
        );
}</>
