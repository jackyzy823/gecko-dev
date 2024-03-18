/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { GeckoViewActorChild } from "resource://gre/modules/GeckoViewActorChild.sys.mjs";

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  ManifestObtainer: "resource://gre/modules/ManifestObtainer.sys.mjs",
  E10SUtils: "resource://gre/modules/E10SUtils.sys.mjs",
});

export class ContentDelegateChild extends GeckoViewActorChild {
  notifyParentOfViewportFit() {
    if (this.triggerViewportFitChange) {
      this.contentWindow.cancelIdleCallback(this.triggerViewportFitChange);
    }
    this.triggerViewportFitChange = this.contentWindow.requestIdleCallback(
      () => {
        this.triggerViewportFitChange = null;
        const viewportFit = this.contentWindow.windowUtils.getViewportFitInfo();
        if (this.lastViewportFit === viewportFit) {
          return;
        }
        this.lastViewportFit = viewportFit;
        this.eventDispatcher.sendRequest({
          type: "GeckoView:DOMMetaViewportFit",
          viewportfit: viewportFit,
        });
      }
    );
  }

  // eslint-disable-next-line complexity
  handleEvent(aEvent) {
    debug`handleEvent: ${aEvent.type}`;

    function nearestParentAttribute(aNode, aAttribute) {
      while (aNode && aNode.hasAttribute && !aNode.hasAttribute(aAttribute)) {
        aNode = aNode.parentNode;
      }
      return aNode && aNode.getAttribute && aNode.getAttribute(aAttribute);
    }

    function createAbsoluteUri(aBaseUri, aUri) {
      if (!aUri || !aBaseUri || !aBaseUri.displaySpec) {
        return null;
      }
      return Services.io.newURI(aUri, null, aBaseUri).displaySpec;
    }

    switch (aEvent.type) {
      case "auxclick":
        // what about openingwindowinfo?
        // TODO only handle middle click
        // TODO  only handle hit on url or media?
        // TODO what if we want auto scroll feature?
        if (
          aEvent.defaultPrevented ||
          aEvent.button != 1 ||
          !Services.prefs.getBoolPref("middlemouse.openNewWindow", true)
        ) {
          return;
        }

        // TODO exclude conteneditable like ClickHandler

        // TODO event.isTrusted?

        const node = aEvent.composedTarget;
        const baseUri = node.ownerDocument.baseURIObject;
        const uri = createAbsoluteUri(
          baseUri,
          nearestParentAttribute(node, "href")
        );
        const elementType = ChromeUtils.getClassName(node);
        const isImage = elementType === "HTMLImageElement";
        const isMedia =
          elementType === "HTMLVideoElement" ||
          elementType === "HTMLAudioElement";
        let elementSrc = (isImage || isMedia) && (node.currentSrc || node.src);
        if (elementSrc) {
          const isBlob = elementSrc.startsWith("blob:");
          if (isBlob && !URL.isValidObjectURL(elementSrc)) {
            elementSrc = null;
          }
        }
        if (uri || isImage || isMedia) {
          let triggeringPrincipal = node.ownerDocument.nodePrincipal;
          if (triggeringPrincipal) {
            triggeringPrincipal =
              lazy.E10SUtils.serializePrincipal(triggeringPrincipal);
          }
          let csp = node.ownerDocument.csp;
          if (csp) {
            csp = lazy.E10SUtils.serializeCSP(csp);
          }

          let referrerInfo = Cc["@mozilla.org/referrer-info;1"].createInstance(
            Ci.nsIReferrerInfo
          );
          referrerInfo.initWithElement(node);
          referrerInfo = lazy.E10SUtils.serializeReferrerInfo(referrerInfo);

          this.sendAsyncMessage("GeckoView:MiddleClick", {
            uri,
            triggeringPrincipal,
            csp,
            referrerInfo,
            // params,
          });
          aEvent.preventDefault();
        }

        break;

      case "contextmenu": {
        if (aEvent.defaultPrevented) {
          return;
        }

        const node = aEvent.composedTarget;
        const baseUri = node.ownerDocument.baseURIObject;
        const uri = createAbsoluteUri(
          baseUri,
          nearestParentAttribute(node, "href")
        );
        const title = nearestParentAttribute(node, "title");
        const alt = nearestParentAttribute(node, "alt");
        const elementType = ChromeUtils.getClassName(node);
        const isImage = elementType === "HTMLImageElement";
        const isMedia =
          elementType === "HTMLVideoElement" ||
          elementType === "HTMLAudioElement";
        let elementSrc = (isImage || isMedia) && (node.currentSrc || node.src);
        if (elementSrc) {
          const isBlob = elementSrc.startsWith("blob:");
          if (isBlob && !URL.isValidObjectURL(elementSrc)) {
            elementSrc = null;
          }
        }

        if (uri || isImage || isMedia) {
          const msg = {
            type: "GeckoView:ContextMenu",
            // We don't have full zoom on Android, so using CSS coordinates
            // here is fine, since the CSS coordinate spaces match between the
            // child and parent processes.
            screenX: aEvent.screenX,
            screenY: aEvent.screenY,
            baseUri: (baseUri && baseUri.displaySpec) || null,
            uri,
            title,
            alt,
            elementType,
            elementSrc: elementSrc || null,
            textContent: node.textContent || null,
          };

          this.eventDispatcher.sendRequest(msg);
          aEvent.preventDefault();
        }
        break;
      }
      case "MozDOMFullscreen:Request": {
        this.sendAsyncMessage("GeckoView:DOMFullscreenRequest", {});
        break;
      }
      case "MozDOMFullscreen:Entered":
      case "MozDOMFullscreen:Exited":
        // Content may change fullscreen state by itself, and we should ensure
        // that the parent always exits fullscreen when content has left
        // full screen mode.
        if (this.contentWindow?.document.fullscreenElement) {
          break;
        }
      // fall-through
      case "MozDOMFullscreen:Exit":
        this.sendAsyncMessage("GeckoView:DOMFullscreenExit", {});
        break;
      case "DOMMetaViewportFitChanged":
        if (aEvent.originalTarget.ownerGlobal == this.contentWindow) {
          this.notifyParentOfViewportFit();
        }
        break;
      case "DOMContentLoaded": {
        if (aEvent.originalTarget.ownerGlobal == this.contentWindow) {
          // If loaded content doesn't have viewport-fit, parent still
          // uses old value of previous content.
          this.notifyParentOfViewportFit();
        }
        if (this.contentWindow !== this.contentWindow?.top) {
          // Only check WebApp manifest on the top level window.
          return;
        }
        this.contentWindow.requestIdleCallback(async () => {
          const manifest = await lazy.ManifestObtainer.contentObtainManifest(
            this.contentWindow
          );
          if (manifest) {
            this.eventDispatcher.sendRequest({
              type: "GeckoView:WebAppManifest",
              manifest,
            });
          }
        });
        break;
      }
      case "MozFirstContentfulPaint": {
        this.eventDispatcher.sendRequest({
          type: "GeckoView:FirstContentfulPaint",
        });
        break;
      }
      case "MozPaintStatusReset": {
        this.eventDispatcher.sendRequest({
          type: "GeckoView:PaintStatusReset",
        });
        break;
      }
    }
  }
}

const { debug, warn } = ContentDelegateChild.initLogging(
  "ContentDelegateChild"
);
