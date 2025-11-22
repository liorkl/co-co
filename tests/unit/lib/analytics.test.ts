import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { track, trackPageView, trackCTAClick } from "@/lib/analytics";

describe("Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("track", () => {
    it("logs events in development mode", () => {
      const consoleSpy = vi.spyOn(console, "log");
      vi.stubEnv("NODE_ENV", "development");
      
      track({ type: "page_view", path: "/test" });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "[Analytics]",
        { type: "page_view", path: "/test" }
      );
    });

    it("does not log in production mode", () => {
      const consoleSpy = vi.spyOn(console, "log");
      vi.stubEnv("NODE_ENV", "production");
      
      track({ type: "page_view", path: "/test" });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe("trackPageView", () => {
    it("tracks page view events", () => {
      const consoleSpy = vi.spyOn(console, "log");
      vi.stubEnv("NODE_ENV", "development");
      
      trackPageView("/landing");
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "[Analytics]",
        { type: "page_view", path: "/landing" }
      );
    });
  });

  describe("trackCTAClick", () => {
    it("tracks CTA clicks without role", () => {
      const consoleSpy = vi.spyOn(console, "log");
      vi.stubEnv("NODE_ENV", "development");
      
      trackCTAClick("hero_signup");
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "[Analytics]",
        { type: "cta_click", cta: "hero_signup" }
      );
    });

    it("tracks CTA clicks with role", () => {
      const consoleSpy = vi.spyOn(console, "log");
      vi.stubEnv("NODE_ENV", "development");
      
      trackCTAClick("hero_ceo_signup", "CEO");
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "[Analytics]",
        { type: "cta_click", cta: "hero_ceo_signup", role: "CEO" }
      );
    });
  });
});


