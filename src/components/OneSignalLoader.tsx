import { useEffect } from "react";

const ONESIGNAL_APP_ID = "2706bd51-0eee-427c-a1b4-3dfcc95d8f78";
const SAFARI_WEB_ID = "web.onesignal.auto.42aad723-0313-4434-93db-5c9a006ef44f";
const SDK_SRC = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: unknown) => void>;
    __oneSignalLoaded?: boolean;
  }
}

/**
 * Loads the OneSignal Web Push SDK on the client.
 * Renders nothing. Mount only inside the admin area so only the owner subscribes.
 */
export function OneSignalLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__oneSignalLoaded) return;
    window.__oneSignalLoaded = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: unknown) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (OneSignal as any).init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: SAFARI_WEB_ID,
          notifyButton: { enable: true },
          allowLocalhostAsSecureOrigin: true,
        });
      } catch (err) {
        console.error("OneSignal init failed", err);
      }
    });

    if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SDK_SRC;
      s.defer = true;
      document.head.appendChild(s);
    }
  }, []);

  return null;
}