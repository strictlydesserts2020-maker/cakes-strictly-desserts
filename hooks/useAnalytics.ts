/**
 * useAnalytics
 *
 * Exposes all GA4 event helpers as a single hook.
 * Use in any 'use client' component — no need to import from lib/analytics directly.
 *
 * @example
 *   const { navClick, productView, trackEvent } = useAnalytics();
 *   <button onClick={() => navClick('Home')}>Home</button>
 *   <button onClick={() => trackEvent({ event_name: 'custom_event', category: 'Test' })}>Track</button>
 */
import { analytics, trackEvent, type TrackEventParams } from '@/lib/analytics';

export function useAnalytics() {
  return {
    /** Send any GA4 event with full parameter control */
    trackEvent: (params: TrackEventParams) => trackEvent(params),
    /** Pre-defined typed event helpers */
    ...analytics,
  };
}
