// Inside the Android and iOS apps (and an installed PWA) the app opens, not the website.
// The middleware catches most app launches on the server, but the Android app's referrer
// is lost once the service worker re-sends the request, so the website page checks again
// in the browser and jumps to the app.

/** Set by the app's "Website" button, so choosing the website from the app is respected. */
export const SITE_VISIT_KEY = "ep-site-visit";

/** Runs before the website renders: inside an app, unless the website was chosen, open the app. */
export function appRedirectScript(appHref: string): string {
  return `(function(){try{
var m=function(q){return window.matchMedia&&window.matchMedia(q).matches};
var app=m("(display-mode: standalone)")||m("(display-mode: fullscreen)")||m("(display-mode: minimal-ui)")
||navigator.standalone===true||/\\bEPartyApp\\b/.test(navigator.userAgent)||!!window.Capacitor;
if(app&&!sessionStorage.getItem(${JSON.stringify(SITE_VISIT_KEY)}))location.replace(${JSON.stringify(appHref)});
}catch(e){}})()`;
}

/** Called by the app's "Website" button. */
export function rememberSiteVisit() {
  try {
    sessionStorage.setItem(SITE_VISIT_KEY, "1");
  } catch {}
}
