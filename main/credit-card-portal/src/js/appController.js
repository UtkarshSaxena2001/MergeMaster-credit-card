define([
  "knockout",
  "ojs/ojresponsiveutils",
  "ojs/ojresponsiveknockoututils",
  "ojs/ojcorerouter",
  "ojs/ojmodulerouter-adapter",
  "ojs/ojknockoutrouteradapter",
  "ojs/ojurlparamadapter",
  "ojs/ojarraydataprovider",
  "ojs/ojknockout",
  "ojs/ojmodule-element",
  "ojs/ojdrawerpopup",
  "ojs/ojcontext",
  "./appState"
], function (
  ko,
  ResponsiveUtils,
  ResponsiveKnockoutUtils,
  CoreRouter,
  ModuleRouterAdapter,
  KnockoutRouterAdapter,
  UrlParamAdapter,
  ArrayDataProvider,
  _knockout,
  _moduleElement,
  _drawerPopup,
  Context,
  appStateModule
) {
  "use strict";

  const appState = appStateModule.appState;
  const TILT_SELECTOR = [
    ".metric-card",
    ".portfolio-card",
    ".quick-actions-card",
    ".credit-card-tile"
  ].join(", ");
  const INTERACTIVE_SELECTOR = [
    "a",
    "button",
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "[role='button']",
    "[data-motion-interactive]"
  ].join(", ");
  const RIPPLE_HOST_SELECTOR = [
    "a",
    "button",
    "[role='button']",
    ".quick-action"
  ].join(", ");
  const PAGE_REVEAL_SELECTOR = [
    ".page-heading",
    ".metric-card",
    ".portfolio-card",
    ".quick-actions-card",
    ".activity-card",
    ".overview-strip",
    ".form-card",
    ".data-card",
    ".transaction-form-card",
    ".activity-table-card",
    ".card-grid .credit-card-tile"
  ].join(", ");

  /**
   * Keeps optional visual-motion enhancements outside individual Knockout view
   * models. Every effect is opt-in through CSS classes/variables, so the app
   * remains functional when the corresponding presentation markup is absent.
   */
  class MotionController {
    constructor() {
      this.rootElement = document.documentElement;
      this.mainElement = null;
      this.pageObserver = null;
      this.motionFrame = null;
      this.pageFrame = null;
      this.pendingPages = new Set();
      this.pointerListenersAttached = false;
      this.motionEnabled = false;
      this.pointerVisible = false;
      this.cursorX = 0;
      this.cursorY = 0;
      this.ringX = 0;
      this.ringY = 0;
      this.ringInitialized = false;
      this.cursorDotElement = null;
      this.cursorRingElement = null;
      this.interactiveTarget = null;
      this.tiltTarget = null;
      this.tiltPointerX = 0;
      this.tiltPointerY = 0;

      this.reducedMotionQuery = typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
      this.finePointerQuery = typeof window.matchMedia === "function"
        ? window.matchMedia("(hover: hover) and (pointer: fine)")
        : null;

      this.handleMediaChange = this.handleMediaChange.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerOver = this.handlePointerOver.bind(this);
      this.handlePointerOut = this.handlePointerOut.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerExit = this.handlePointerExit.bind(this);
      this.handleWindowBlur = this.handleWindowBlur.bind(this);
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

      this.listenForMediaChanges(this.reducedMotionQuery);
      this.listenForMediaChanges(this.finePointerQuery);
      this.observeModulePages();
      this.updateMotionAvailability();
    }

    listenForMediaChanges(query) {
      if (!query) return;
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", this.handleMediaChange);
      } else if (typeof query.addListener === "function") {
        query.addListener(this.handleMediaChange);
      }
    }

    handleMediaChange() {
      this.updateMotionAvailability();
    }

    updateMotionAvailability() {
      const canUseFinePointer = Boolean(this.finePointerQuery && this.finePointerQuery.matches);
      const prefersReducedMotion = Boolean(this.reducedMotionQuery && this.reducedMotionQuery.matches);
      const shouldEnable = canUseFinePointer && !prefersReducedMotion;

      if (shouldEnable === this.motionEnabled) return;
      this.motionEnabled = shouldEnable;
      if (shouldEnable) {
        this.addPointerListeners();
      } else {
        this.removePointerListeners();
        this.hidePointer();
      }
    }

    addPointerListeners() {
      if (this.pointerListenersAttached) return;
      this.pointerListenersAttached = true;
      document.addEventListener("pointermove", this.handlePointerMove, { passive: true });
      document.addEventListener("pointerover", this.handlePointerOver, { passive: true });
      document.addEventListener("pointerout", this.handlePointerOut, { passive: true });
      document.addEventListener("pointerdown", this.handlePointerDown, { passive: true });
      document.addEventListener("pointerleave", this.handlePointerExit, { passive: true });
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("blur", this.handleWindowBlur);
    }

    removePointerListeners() {
      if (!this.pointerListenersAttached) return;
      this.pointerListenersAttached = false;
      document.removeEventListener("pointermove", this.handlePointerMove);
      document.removeEventListener("pointerover", this.handlePointerOver);
      document.removeEventListener("pointerout", this.handlePointerOut);
      document.removeEventListener("pointerdown", this.handlePointerDown);
      document.removeEventListener("pointerleave", this.handlePointerExit);
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      window.removeEventListener("blur", this.handleWindowBlur);
    }

    handlePointerMove(event) {
      if (!this.canHandlePointerEvent(event)) return;
      if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;

      this.cursorX = event.clientX;
      this.cursorY = event.clientY;
      this.tiltPointerX = event.clientX;
      this.tiltPointerY = event.clientY;
      if (!this.ringInitialized) {
        this.ringX = event.clientX;
        this.ringY = event.clientY;
        this.ringInitialized = true;
      }

      this.pointerVisible = true;
      this.rootElement.classList.add("motion-cursor-visible");
      this.setInteractiveTarget(this.findInteractiveTarget(event.target));
      this.setTiltTarget(this.findTiltTarget(event.target));
      this.requestMotionFrame();
    }

    handlePointerOver(event) {
      if (!this.canHandlePointerEvent(event)) return;
      this.setInteractiveTarget(this.findInteractiveTarget(event.target));
      this.setTiltTarget(this.findTiltTarget(event.target));
    }

    handlePointerOut(event) {
      if (!this.canHandlePointerEvent(event)) return;
      const relatedTarget = event.relatedTarget;
      if (!relatedTarget) {
        this.hidePointer();
        return;
      }

      if (this.interactiveTarget && !this.interactiveTarget.contains(relatedTarget)) {
        this.setInteractiveTarget(this.findInteractiveTarget(relatedTarget));
      }
      if (this.tiltTarget && !this.tiltTarget.contains(relatedTarget)) {
        this.setTiltTarget(this.findTiltTarget(relatedTarget));
      }
    }

    handlePointerDown(event) {
      if (!this.canHandlePointerEvent(event)) return;
      this.createRipple(event);
    }

    handlePointerExit() {
      this.hidePointer();
    }

    handleWindowBlur() {
      this.hidePointer();
    }

    handleVisibilityChange() {
      if (document.hidden) this.hidePointer();
    }

    canHandlePointerEvent(event) {
      return this.motionEnabled && (!event.pointerType || event.pointerType !== "touch");
    }

    findInteractiveTarget(target) {
      const element = this.asElement(target);
      if (!element) return null;
      const interactive = element.closest(INTERACTIVE_SELECTOR);
      if (!interactive || interactive.disabled || interactive.getAttribute("aria-disabled") === "true") return null;
      return interactive;
    }

    findTiltTarget(target) {
      const element = this.asElement(target);
      return element ? element.closest(TILT_SELECTOR) : null;
    }

    asElement(target) {
      if (!target) return null;
      if (target.nodeType === 1) return target;
      return target.parentElement || null;
    }

    setInteractiveTarget(target) {
      if (target === this.interactiveTarget) return;
      if (this.interactiveTarget) this.interactiveTarget.classList.remove("motion-interactive-active");
      this.interactiveTarget = target;
      if (target) target.classList.add("motion-interactive-active");

      const isInteractive = Boolean(target);
      this.rootElement.classList.toggle("motion-over-interactive", isInteractive);
      this.setCursorElementState(this.cursorDotElement, this.pointerVisible, isInteractive);
      this.setCursorElementState(this.cursorRingElement, this.pointerVisible, isInteractive);
    }

    setTiltTarget(target) {
      if (target === this.tiltTarget) return;
      this.resetTiltTarget();
      this.tiltTarget = target;
      if (!target) return;
      target.classList.add("motion-tilt", "motion-tilt-active");
      this.tiltPointerX = this.cursorX;
      this.tiltPointerY = this.cursorY;
      this.requestMotionFrame();
    }

    resetTiltTarget() {
      if (!this.tiltTarget) return;
      this.tiltTarget.style.setProperty("--tilt-x", "0deg");
      this.tiltTarget.style.setProperty("--tilt-y", "0deg");
      this.tiltTarget.style.setProperty("--tilt-glow-x", "50%");
      this.tiltTarget.style.setProperty("--tilt-glow-y", "50%");
      this.tiltTarget.classList.remove("motion-tilt-active");
      this.tiltTarget = null;
    }

    requestMotionFrame() {
      if (this.motionFrame !== null) return;
      this.motionFrame = window.requestAnimationFrame(() => this.flushMotionFrame());
    }

    flushMotionFrame() {
      this.motionFrame = null;
      if (!this.motionEnabled || !this.pointerVisible) return;

      this.updateTilt();
      this.updateCursorVariables();

      const ringDistance = Math.hypot(this.cursorX - this.ringX, this.cursorY - this.ringY);
      if (ringDistance > 0.25) this.requestMotionFrame();
    }

    updateTilt() {
      if (!this.tiltTarget || !this.tiltTarget.isConnected) {
        this.resetTiltTarget();
        return;
      }

      const bounds = this.tiltTarget.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.min(1, Math.max(0, (this.tiltPointerX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (this.tiltPointerY - bounds.top) / bounds.height));
      const tiltX = (0.5 - y) * 6;
      const tiltY = (x - 0.5) * 8;

      this.tiltTarget.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      this.tiltTarget.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      this.tiltTarget.style.setProperty("--tilt-glow-x", `${(x * 100).toFixed(1)}%`);
      this.tiltTarget.style.setProperty("--tilt-glow-y", `${(y * 100).toFixed(1)}%`);
    }

    updateCursorVariables() {
      this.ringX += (this.cursorX - this.ringX) * 0.18;
      this.ringY += (this.cursorY - this.ringY) * 0.18;
      const width = Math.max(window.innerWidth || 1, 1);
      const height = Math.max(window.innerHeight || 1, 1);
      const xPercent = Math.min(100, Math.max(0, (this.cursorX / width) * 100));
      const yPercent = Math.min(100, Math.max(0, (this.cursorY / height) * 100));

      this.rootElement.style.setProperty("--cursor-x", `${this.cursorX}px`);
      this.rootElement.style.setProperty("--cursor-y", `${this.cursorY}px`);
      this.rootElement.style.setProperty("--cursor-x-percent", `${xPercent.toFixed(2)}%`);
      this.rootElement.style.setProperty("--cursor-y-percent", `${yPercent.toFixed(2)}%`);

      const dot = this.getCursorElement("dot");
      const ring = this.getCursorElement("ring");
      this.setCursorPosition(dot, this.cursorX, this.cursorY);
      this.setCursorPosition(ring, this.ringX, this.ringY);
      this.setCursorElementState(dot, true, Boolean(this.interactiveTarget));
      this.setCursorElementState(ring, true, Boolean(this.interactiveTarget));
    }

    getCursorElement(kind) {
      const property = kind === "dot" ? "cursorDotElement" : "cursorRingElement";
      if (this[property] && this[property].isConnected) return this[property];
      this[property] = document.querySelector(kind === "dot" ? "#cursorDot, .cursor-dot" : "#cursorRing, .cursor-ring");
      return this[property];
    }

    setCursorPosition(element, x, y) {
      if (!element) return;
      element.style.setProperty("--cursor-x", `${x.toFixed(2)}px`);
      element.style.setProperty("--cursor-y", `${y.toFixed(2)}px`);
    }

    setCursorElementState(element, visible, interactive) {
      if (!element) return;
      element.classList.toggle("motion-cursor-visible", visible);
      element.classList.toggle("motion-cursor-interactive", interactive);
    }

    hidePointer() {
      this.pointerVisible = false;
      this.ringInitialized = false;
      this.rootElement.classList.remove("motion-cursor-visible", "motion-over-interactive");
      this.setInteractiveTarget(null);
      this.resetTiltTarget();
      this.setCursorElementState(this.getCursorElement("dot"), false, false);
      this.setCursorElementState(this.getCursorElement("ring"), false, false);
      if (this.motionFrame !== null) {
        window.cancelAnimationFrame(this.motionFrame);
        this.motionFrame = null;
      }
    }

    createRipple(event) {
      const element = this.asElement(event.target);
      if (!element) return;
      const host = element.closest(RIPPLE_HOST_SELECTOR);
      if (!host || host.disabled || host.getAttribute("aria-disabled") === "true") return;

      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const radius = Math.max(
        Math.hypot(x, y),
        Math.hypot(bounds.width - x, y),
        Math.hypot(x, bounds.height - y),
        Math.hypot(bounds.width - x, bounds.height - y)
      );
      const ripple = document.createElement("span");
      ripple.className = "motion-ripple";
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.setProperty("--ripple-x", `${x.toFixed(1)}px`);
      ripple.style.setProperty("--ripple-y", `${y.toFixed(1)}px`);
      ripple.style.setProperty("--ripple-size", `${Math.ceil(radius * 2)}px`);
      host.classList.add("motion-ripple-host");
      host.appendChild(ripple);

      let removed = false;
      const removeRipple = () => {
        if (removed) return;
        removed = true;
        ripple.remove();
      };
      ripple.addEventListener("animationend", removeRipple, { once: true });
      window.setTimeout(removeRipple, 1000);
    }

    observeModulePages() {
      const mainElement = document.querySelector(".app-main");
      if (!mainElement) {
        window.requestAnimationFrame(() => this.observeModulePages());
        return;
      }
      this.mainElement = mainElement;
      this.queuePageShells(mainElement);

      if (typeof MutationObserver !== "function") return;
      this.pageObserver = new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => this.queuePageShells(node));
        });
      });
      this.pageObserver.observe(mainElement, { childList: true, subtree: true });
    }

    queuePageShells(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.matches(".page-shell")) this.pendingPages.add(node);
      node.querySelectorAll(".page-shell").forEach((page) => this.pendingPages.add(page));
      if (this.pageFrame !== null) return;
      this.pageFrame = window.requestAnimationFrame(() => this.preparePendingPages());
    }

    preparePendingPages() {
      this.pageFrame = null;
      const pages = Array.from(this.pendingPages);
      this.pendingPages.clear();
      pages.forEach((page) => this.preparePageEntrance(page));
    }

    preparePageEntrance(page) {
      if (!page || !page.isConnected || page.dataset.motionPagePrepared === "true") return;
      page.dataset.motionPagePrepared = "true";
      page.classList.add("motion-page");
      page.querySelectorAll(PAGE_REVEAL_SELECTOR).forEach((element, index) => {
        element.classList.add("motion-reveal");
        element.style.setProperty("--motion-delay", `${Math.min(index * 55, 550)}ms`);
      });

      if (this.reducedMotionQuery && this.reducedMotionQuery.matches) {
        page.classList.add("motion-ready");
        return;
      }
      window.requestAnimationFrame(() => {
        if (page.isConnected) page.classList.add("motion-ready");
      });
    }
  }

  class RootViewModel {
    constructor() {
      this.manner = ko.observable("polite");
      this.message = ko.observable();
      this.toastMessage = appState.toastMessage;
      this.toastKind = appState.toastKind;
      this.toastVisible = appState.toastVisible;
      this.dismissToast = appState.dismissToast;
      this.sideDrawerOn = ko.observable(false);
      this.appName = ko.observable("MergeMaster");
      this.userLogin = ko.observable("Credit Operations");
      this.footerLinks = [
        { name: "Dashboard", linkId: "footerDashboard", linkTarget: "?root=dashboard" },
        { name: "Customers", linkId: "footerCustomers", linkTarget: "?root=customers" },
        { name: "Transactions", linkId: "footerTransactions", linkTarget: "?root=transactions" }
      ];

      this.announcementHandler = (event) => {
        this.message(event.detail.message);
        this.manner(event.detail.manner);
      };
      this.toggleDrawer = () => this.sideDrawerOn(!this.sideDrawerOn());
      this.openedChangedHandler = (event) => {
        if (event.detail.value === false) {
          const drawerToggleButtonElement = document.querySelector("#drawerToggleButton");
          if (drawerToggleButtonElement) drawerToggleButtonElement.focus();
        }
      };

      const globalBodyElement = document.getElementById("globalBody");
      globalBodyElement.addEventListener("announce", this.announcementHandler, false);

      const smQuery = ResponsiveUtils.getFrameworkQuery("sm-only");
      if (smQuery) this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const mdQuery = ResponsiveUtils.getFrameworkQuery("md-up");
      if (mdQuery) {
        this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);
        this.mdScreen.subscribe(() => this.sideDrawerOn(false));
      }

      const navData = [
        { path: "", redirect: "dashboard" },
        { path: "dashboard", detail: { label: "Dashboard", iconClass: "oj-ux-ico-bar-chart" } },
        { path: "customers", detail: { label: "Customers", iconClass: "oj-ux-ico-contact-group" } },
        { path: "cards", detail: { label: "Cards", iconClass: "oj-ux-ico-credit-card" } },
        { path: "merchants", detail: { label: "Merchants", iconClass: "oj-ux-ico-store" } },
        { path: "transactions", detail: { label: "Transactions", iconClass: "oj-ux-ico-cash" } }
      ];
      const router = new CoreRouter(navData, { urlAdapter: new UrlParamAdapter() });
      router.sync();
      this.moduleAdapter = new ModuleRouterAdapter(router);
      this.selection = new KnockoutRouterAdapter(router);
      this.navDataProvider = new ArrayDataProvider(navData.slice(1), { keyAttributes: "path" });
      this.motionController = new MotionController();

      window.addEventListener("mergemaster:navigate", (event) => {
        const route = event.detail;
        if (navData.some((item) => item.path === route)) void router.go({ path: route });
      });

      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }
  }

  return new RootViewModel();
});
