// ─── Global type extension for gtag + Meta Pixel ────────────────────────────
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

/** True only in the browser after gtag has been initialised */
export const isAnalyticsEnabled = (): boolean =>
  typeof window !== 'undefined' &&
  !!GA_MEASUREMENT_ID &&
  typeof window.gtag === 'function';

// ─── Meta Pixel ──────────────────────────────────────────────────────────────

/** Sends an event to the Meta Pixel (no-op if the pixel has not loaded). */
export const metaTrack = (
  event: string,
  params?: Record<string, unknown>,
  custom = false,
): void => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq(custom ? 'trackCustom' : 'track', event, params ?? {});
};

// ─── Page View ───────────────────────────────────────────────────────────────

export const trackPageView = (url: string): void => {
  if (!isAnalyticsEnabled()) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
};

// ─── Generic Event ────────────────────────────────────────────────────────────

export interface TrackEventParams {
  event_name: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
}

export const trackEvent = ({
  event_name,
  category,
  label,
  value,
  ...rest
}: TrackEventParams): void => {
  if (!isAnalyticsEnabled()) return;
  window.gtag('event', event_name, {
    event_category: category,
    event_label: label,
    value,
    ...rest,
  });
};

// ─── Named Event Helpers ──────────────────────────────────────────────────────

export const analytics = {
  navClick: (label: string) =>
    trackEvent({ event_name: 'nav_click', category: 'Navigation', label }),

  orderNowClick: (label: string) => {
    trackEvent({ event_name: 'order_now_click', category: 'Engagement', label });
    metaTrack('Lead', { content_name: label });
  },

  whatsappClick: (label = 'WhatsApp') => {
    trackEvent({ event_name: 'whatsapp_click', category: 'Contact', label });
    metaTrack('Contact', { method: 'WhatsApp', content_name: label });
  },

  callButtonClick: (label = 'Call') => {
    trackEvent({ event_name: 'call_button_click', category: 'Contact', label });
    metaTrack('Contact', { method: 'Call', content_name: label });
  },

  instagramClick: () =>
    trackEvent({ event_name: 'instagram_click', category: 'Social', label: 'Instagram' }),

  adminLoginClick: () =>
    trackEvent({ event_name: 'admin_login_click', category: 'Admin', label: 'Admin Login' }),

  cakeCategoryClick: (category: string) =>
    trackEvent({ event_name: 'cake_category_click', category: 'Products', label: category }),

  productView: (productName: string, category?: string) => {
    trackEvent({ event_name: 'view_item', category: category ?? 'Products', label: productName });
    metaTrack('ViewContent', { content_name: productName, content_category: category ?? 'Products' });
  },

  productInquiry: (productName: string) => {
    trackEvent({ event_name: 'product_inquiry', category: 'Conversion', label: productName });
    metaTrack('Lead', { content_name: productName });
  },

  contactFormSubmit: (label = 'Customise Form') => {
    trackEvent({ event_name: 'contact_form_submit', category: 'Conversion', label });
    metaTrack('Lead', { content_name: label });
  },

  scrollDepth: (depth: number) =>
    trackEvent({ event_name: 'scroll_depth', category: 'Engagement', label: depth + '%', value: depth }),

  outboundLinkClick: (url: string) =>
    trackEvent({ event_name: 'outbound_link_click', category: 'Outbound', label: url }),

  page404: (path: string) =>
    trackEvent({ event_name: 'page_not_found', category: 'Error', label: path }),
};
