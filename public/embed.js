/**
 * Instant Estimate embed loader.
 *
 * Installation (PRODUCT_SPEC.md Section 21 — copy/paste only, no build step,
 * no framework assumptions about the host site):
 *
 *   <script src="https://<your-app-domain>/embed.js" data-business="your-slug" async></script>
 *
 * Optional: data-color="#0f172a" to tint the launcher button. The estimate
 * experience itself already picks up the contractor's brand color server-side
 * (see src/app/e/[slug]/page.tsx) — this only affects the button on the
 * host page, before the iframe has loaded anything.
 *
 * Deliberately plain: no bundler, no dependencies, one file, works on any
 * site regardless of what it's built with. Namespaced class names (not
 * Shadow DOM) to keep this simple for V1 — a host page with an aggressively
 * broad CSS reset could in principle bleed into these styles; Shadow DOM
 * would close that gap and is a reasonable follow-up if it ever comes up.
 */
(function () {
  "use strict";

  var currentScript = document.currentScript;
  if (!currentScript) return;

  var slug = currentScript.getAttribute("data-business");
  if (!slug) {
    console.error("[Instant Estimate] embed.js is missing a data-business attribute.");
    return;
  }

  var accentColor = currentScript.getAttribute("data-color") || "#111827";
  var origin;
  try {
    origin = new URL(currentScript.src).origin;
  } catch {
    console.error("[Instant Estimate] Could not determine the app origin from the script tag.");
    return;
  }

  var STYLE_ID = "instant-estimate-embed-styles";
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      ".ie-launcher{position:fixed;bottom:20px;right:20px;z-index:2147483000;" +
      "border:none;border-radius:9999px;padding:14px 20px;font:600 14px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
      "color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);}" +
      ".ie-overlay{position:fixed;bottom:20px;right:20px;z-index:2147483000;" +
      "width:380px;max-width:calc(100vw - 24px);height:640px;max-height:calc(100vh - 24px);" +
      "border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none;background:#fff;}" +
      ".ie-overlay.ie-open{display:block;}" +
      "@media (max-width:480px){.ie-overlay{bottom:0;right:0;width:100vw;height:100vh;max-width:100vw;max-height:100vh;border-radius:0;}}" +
      ".ie-overlay iframe{width:100%;height:100%;border:none;display:block;}" +
      ".ie-close{position:absolute;top:8px;right:8px;z-index:1;width:28px;height:28px;border-radius:9999px;" +
      "border:none;background:rgba(17,24,39,.65);color:#fff;font:16px/1 sans-serif;cursor:pointer;}";
    document.head.appendChild(style);
  }

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "ie-launcher";
  launcher.style.background = accentColor;
  launcher.textContent = "Get an Instant Estimate";
  launcher.setAttribute("aria-label", "Get an instant estimate");

  var overlay = null;

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "ie-overlay";
    overlay.style.position = "fixed";

    var closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "ie-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.addEventListener("click", closeWidget);

    var iframe = document.createElement("iframe");
    iframe.src = origin + "/e/" + encodeURIComponent(slug) + "?embedded=1";
    iframe.title = "Instant Estimate";
    iframe.setAttribute("loading", "lazy");

    overlay.appendChild(closeButton);
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    return overlay;
  }

  function openWidget() {
    ensureOverlay().classList.add("ie-open");
  }

  function closeWidget() {
    if (overlay) overlay.classList.remove("ie-open");
  }

  launcher.addEventListener("click", function () {
    if (overlay && overlay.classList.contains("ie-open")) {
      closeWidget();
    } else {
      openWidget();
    }
  });

  document.body.appendChild(launcher);
})();
