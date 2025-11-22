/**
 * Analytics utility for tracking events
 * Currently logs to console and can be extended to PostHog/Segment/etc.
 */

export type AnalyticsEvent = 
  | { type: 'page_view'; path: string }
  | { type: 'cta_click'; cta: string; role?: 'CEO' | 'CTO' }
  | { type: 'signup_start'; role?: 'CEO' | 'CTO' }
  | { type: 'onboarding_step'; step: string }
  | { type: 'match_view'; matchId?: string }
  | { type: 'intro_request'; matchId?: string };

/**
 * Track an analytics event
 * In production, this would send to PostHog, Segment, Mixpanel, etc.
 */
export function track(event: AnalyticsEvent): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }

  // In production, send to analytics service
  // Example: posthog.capture(event.type, event);
  // Example: analytics.track(event.type, event);
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  track({ type: 'page_view', path });
}

/**
 * Track CTA click
 */
export function trackCTAClick(cta: string, role?: 'CEO' | 'CTO'): void {
  track({ type: 'cta_click', cta, role });
}


