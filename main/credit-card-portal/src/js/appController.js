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
  "./appState",
  "./api",
  "./helpAssistant"
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
  appStateModule,
  apiModule,
  helpAssistant
) {
  "use strict";

  const appState = appStateModule.appState;
  const { api, asArray, formatCurrency, formatDate, formatDateTime, maskCardNumber } = apiModule;
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
      this.appName = ko.observable("Credit Vault");
      this.isAuthenticated = appState.isAuthenticated;
      this.isAdmin = appState.isAdmin;
      this.isCustomer = appState.isCustomer;
      this.userLogin = appState.userName;
      this.userRole = appState.roleLabel;
      this.loginUsername = ko.observable("");
      this.loginPassword = ko.observable("");
      this.loginBusy = ko.observable(false);
      this.loginError = ko.observable("");
      this.loginRole = ko.observable("customer");
      this.customerAuthMethod = ko.observable("otp");
      this.customerMobile = ko.observable("");
      this.customerOtp = ko.observable("");
      this.otpRequested = ko.observable(false);
      this.localCustomerOtp = ko.observable("");
      this.localOtpCustomer = ko.observable(null);
      this.setupCustomerName = ko.observable("");
      this.setupPassword = ko.observable("");
      this.setupConfirmPassword = ko.observable("");
      this.loginReady = ko.observable(false);
      this.loginIntroVisible = ko.observable(false);
      this.loginIntroLogoVisible = ko.observable(false);
      this.loginIntroTimers = [];
      this.loginIntroNext = null;
      this.footerLinks = ko.observableArray([]);
      this.footerDataProvider = null;
      this.navItems = ko.observableArray([]);
      this.router = null;

      this.adminNavItems = [
        { path: "dashboard", detail: { label: "Dashboard", iconClass: "oj-ux-ico-bar-chart" } },
        { path: "customers", detail: { label: "Customers", iconClass: "oj-ux-ico-contact-group" } },
        { path: "cards", detail: { label: "Cards", iconClass: "oj-ux-ico-credit-card" } },
        { path: "merchants", detail: { label: "Merchants", iconClass: "oj-ux-ico-store" } },
        { path: "transactions", detail: { label: "Transactions", iconClass: "oj-ux-ico-cash" } }
      ];
      this.customerNavItems = [
        { path: "dashboard", detail: { label: "My dashboard", iconClass: "oj-ux-ico-bar-chart" } },
        { path: "transactions", detail: { label: "My transactions", iconClass: "oj-ux-ico-cash" } }
      ];
      this.normalizeLoginName = (value) => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
      this.isRouteAllowed = (route) => {
        if (!this.isAuthenticated()) return false;
        return !this.isCustomer() || route === "dashboard" || route === "transactions";
      };
      this.applyRoleNavigation = () => {
        if (!this.isAuthenticated()) {
          this.navItems([]);
          this.footerLinks([]);
          return;
        }
        const isCustomer = this.isCustomer();
        this.navItems(isCustomer ? this.customerNavItems : this.adminNavItems);
        this.footerLinks(isCustomer
          ? [
            { name: "My dashboard", linkId: "footerDashboard", linkTarget: "?root=dashboard" },
            { name: "My transactions", linkId: "footerTransactions", linkTarget: "?root=transactions" }
          ]
          : [
            { name: "Dashboard", linkId: "footerDashboard", linkTarget: "?root=dashboard" },
            { name: "Customers", linkId: "footerCustomers", linkTarget: "?root=customers" },
            { name: "Transactions", linkId: "footerTransactions", linkTarget: "?root=transactions" }
          ]);
      };

      this.assistantOpen = ko.observable(false);
      this.assistantUnread = ko.observable(true);
      this.assistantQuery = ko.observable("");
      this.assistantMessages = ko.observableArray([]);
      this.assistantSuggestions = ko.observableArray([]);
      this.assistantRoute = ko.observable("dashboard");
      this.assistantLiveMessage = ko.observable("");
      this.assistantBusy = ko.observable(false);
      this.assistantRequestVersion = 0;
      this.assistantRoleLabel = ko.pureComputed(() => this.isAdmin() ? "Admin Assistant" : "Customer Assistant");
      this.assistantLauncherHeading = ko.pureComputed(() => this.isAdmin() ? "Need an insight?" : "Need a hand?");
      this.assistantLauncherSubheading = ko.pureComputed(() => this.isAdmin() ? "Ask MergeGuide" : "Ask MergeGuide");
      this.assistantFootnote = ko.pureComputed(() => this.isAdmin()
        ? "Report answers use the current portal data. No customer-sensitive details are exposed in chat."
        : "Answers use your current account data when you ask for it. Do not share passwords or full card numbers.");
      this.assistantContextTitle = ko.pureComputed(() => `${this.assistantRoleLabel()} · ${helpAssistant.getRouteLabel(this.assistantRoute())}`);
      this.assistantContextCaption = ko.pureComputed(() => {
        if (this.isCustomer()) {
          const customerCaptions = {
            dashboard: "Your card health, balances, and account activity",
            transactions: "Your own transaction history and simple guidance"
          };
          return customerCaptions[this.assistantRoute()] || "Read-only account guidance for this workspace";
        }
        const captions = {
          dashboard: "Portfolio signals, verified summaries, and quick actions",
          customers: "Record guidance and customer lookup workflow",
          cards: "Issuing, limits, statuses, and card settings",
          merchants: "Partners, categories, and merchant report context",
          transactions: "Purchases, payments, safeguards, and report totals"
        };
        return captions[this.assistantRoute()] || "Practical guidance for operations";
      });
      this.getAssistantRoute = () => {
        const match = /[?&]root=([^&]+)/.exec(window.location.search || "");
        const requestedRoute = match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "dashboard";
        return helpAssistant.resolveRoute(requestedRoute) || "dashboard";
      };
      this.getRoleAssistantPrompts = (route, limit = 4) => {
        const activeRoute = helpAssistant.resolveRoute(route) || "dashboard";
        const customerPrompts = {
          dashboard: [
            "What is my card status?",
            "Show my available credit",
            "What is my outstanding balance?",
            "Show my recent transactions"
          ],
          transactions: [
            "Show my recent transactions",
            "How do purchases and payments work?",
            "Why might a transaction be declined?",
            "How do I filter my activity?"
          ]
        };
        const adminPrompts = {
          dashboard: [
            "Show today's transaction summary",
            "Which merchant has the highest purchases?",
            "How do I check a card status?",
            "How do I register a customer?"
          ],
          customers: [
            "How do I find a customer record?",
            "What customer details are required?",
            "How do I apply for a credit card?",
            "What customer data should stay private?"
          ],
          cards: [
            "How do I issue a card?",
            "What do Active and Blocked mean?",
            "How do I check available credit?",
            "Why is a card transaction rejected?"
          ],
          merchants: [
            "How do I find a merchant?",
            "Why is a merchant not found?",
            "Which merchant has the highest purchases?",
            "How do I filter merchants by category?"
          ],
          transactions: [
            "Show today's transaction summary",
            "How do purchases and payments work?",
            "Why will a transaction not post?",
            "How do I filter transaction history?"
          ]
        };
        const prompts = (this.isCustomer() ? customerPrompts[activeRoute] : adminPrompts[activeRoute])
          || helpAssistant.getSuggestedPrompts(activeRoute, limit).map((item) => item.text);
        return prompts.slice(0, limit).map((text, index) => ({
          id: `${this.isCustomer() ? "customer" : "admin"}-${activeRoute}-prompt-${index}`,
          text,
          route: activeRoute
        }));
      };
      this.formatAssistantSuggestions = (suggestions) => (suggestions || [])
        .filter((suggestion) => !this.isCustomer() || !suggestion.route || this.isRouteAllowed(suggestion.route))
        .map((suggestion) => ({
          id: suggestion.id,
          label: suggestion.text || suggestion.label,
          question: suggestion.text || suggestion.question,
          route: suggestion.route
        }));
      this.makeAssistantWelcome = (route) => ({
        role: "assistant",
        title: "Welcome to MergeGuide",
        body: this.isCustomer()
          ? `I can explain your own ${helpAssistant.getRouteLabel(route).toLowerCase()}, check card balances and status from the current portal data, and help with transaction questions. Your workspace is read-only; I will never perform a payment, purchase, or card change for you.`
          : `I can guide you through customer, card, merchant, and transaction workflows, explain safeguards, and create current operational summaries from portal data. I will not expose sensitive customer data or perform financial actions in chat.`,
        steps: [],
        action: null,
        meta: "Guidance only — no financial action is performed in chat."
      });
      this.scrollAssistantToLatest = () => {
        window.requestAnimationFrame(() => {
          const conversation = document.getElementById("guideConversation");
          if (conversation) conversation.scrollTop = conversation.scrollHeight;
        });
      };
      this.refreshAssistantContext = () => {
        const route = this.getAssistantRoute();
        this.assistantRoute(route);
        this.assistantSuggestions(this.formatAssistantSuggestions(this.getRoleAssistantPrompts(route, 4)));
      };
      this.clearAssistantConversation = () => {
        this.assistantRequestVersion += 1;
        this.assistantBusy(false);
        const route = this.getAssistantRoute();
        this.assistantRoute(route);
        this.assistantMessages([this.makeAssistantWelcome(route)]);
        this.assistantQuery("");
        this.assistantLiveMessage("MergeGuide is ready for a new question.");
        this.refreshAssistantContext();
        this.scrollAssistantToLatest();
      };
      this.openAssistant = () => {
        if (!this.isAuthenticated()) return;
        this.refreshAssistantContext();
        this.assistantOpen(true);
        this.assistantUnread(false);
        window.setTimeout(() => {
          const input = document.getElementById("guideInput");
          if (input) input.focus();
        }, 260);
      };
      this.closeAssistant = () => {
        if (!this.assistantOpen()) return;
        this.assistantOpen(false);
        window.setTimeout(() => {
          const launcher = document.getElementById("guideLauncher");
          if (launcher) launcher.focus();
        }, 280);
      };
      this.toggleAssistant = () => {
        if (this.assistantOpen()) this.closeAssistant();
        else this.openAssistant();
      };
      this.askAssistantSuggestion = (suggestion) => {
        const question = suggestion && (suggestion.question || suggestion.text || suggestion.label);
        if (!question) return;
        this.assistantQuery(question);
        this.submitAssistant();
      };
      this.isCustomerActionRequest = (normalizedQuestion) => {
        const asksForChange = /\b(add|apply|block|change|create|delete|edit|issue|make|manage|pay|post|record|remove|unblock|update)\b/.test(normalizedQuestion);
        const namesAnOperation = /\b(card|customer|merchant|payment|purchase|transaction)\b/.test(normalizedQuestion);
        return asksForChange && namesAnOperation;
      };
      this.getAssistantDataIntent = (normalizedQuestion) => {
        if (this.isAdmin()) {
          const asksForReport = /\b(report|reports|summary|summaries|total|totals)\b/.test(normalizedQuestion)
            || /\b(top merchant|highest purchases|purchase totals|payment totals|transaction totals)\b/.test(normalizedQuestion);
          const asksForDailyMetric = /\b(today|daily)\b/.test(normalizedQuestion)
            && /\b(purchase|payment|amount|spend|total|summary)\b/.test(normalizedQuestion);
          if (asksForReport || asksForDailyMetric) {
            return "admin-report";
          }
          return "";
        }
        if (!this.isCustomer()) return "";
        const hasAccountReference = /\b(my|mine|account|current)\b/.test(normalizedQuestion);
        const requestsLiveValue = /\b(show|check|list|current|my|mine|account|how much)\b/.test(normalizedQuestion);
        const asksForCardDetails = /\b(status|active|blocked|expiry|expired|expire|type)\b/.test(normalizedQuestion)
          && requestsLiveValue
          && (/\b(card|cards)\b/.test(normalizedQuestion) || hasAccountReference);
        if (asksForCardDetails) return "customer-card-details";
        if (requestsLiveValue && /\b(available credit|outstanding|balance|balances|credit limit|available)\b/.test(normalizedQuestion)) {
          return "customer-balances";
        }
        const asksForTransactionList = /\b(show|list|recent|latest|history|activity)\b/.test(normalizedQuestion)
          && !/\b(filter|search|find|clear)\b/.test(normalizedQuestion);
        if (asksForTransactionList && hasAccountReference) {
          return "customer-transactions";
        }
        return "";
      };
      this.formatCardType = (cardType) => {
        const value = String(cardType || "Card").toLowerCase();
        return value.charAt(0).toUpperCase() + value.slice(1);
      };
      this.liveAssistantMeta = () => `Current portal data snapshot · ${formatDateTime(new Date())}`;
      this.makeCustomerActionAnswer = () => ({
        title: "This request needs Credit Operations",
        body: "I can explain the process and show your current account information, but I cannot make a purchase or payment, apply for a card, or change a card status in chat. Those requests need a verified Credit Operations workflow.",
        steps: [
          "Review your current account activity in My transactions.",
          "Contact Credit Operations for a verified payment, card, or account request."
        ],
        action: { label: "Open my transactions", route: "transactions" },
        meta: "No financial or card action was performed."
      });
      this.makeCustomerEducationAnswer = () => ({
        title: "How purchases and payments affect your card",
        body: "A purchase adds to the outstanding balance and reduces available credit. A payment reduces the outstanding balance and restores available credit. Your customer workspace lets you review this activity, while Credit Operations records the transaction after verification.",
        steps: [
          "Use My transactions to review purchases and payments already recorded.",
          "Use your dashboard to compare available credit with outstanding balance.",
          "Contact Credit Operations if you need a payment or purchase action processed."
        ],
        action: { label: "Open my transactions", route: "transactions" },
        meta: "Guidance only — no transaction was created."
      });
      this.isCustomerTransactionErrorQuestion = (normalizedQuestion) => /\b(declined|decline|rejected|reject|failed|fail|error|insufficient|exceed|exceeds|expired|blocked|merchant not found|merchant missing|cannot post|cant post|not post)\b/.test(normalizedQuestion);
      this.makeCustomerTransactionErrorAnswer = (normalizedQuestion) => {
        if (/\b(merchant not found|merchant missing|merchant does not exist|cannot find merchant)\b/.test(normalizedQuestion)) {
          return {
            title: "The merchant could not be found",
            body: "A purchase can only be recorded against a merchant already in the directory. Check the merchant name and category, then ask Credit Operations to review or add a genuinely new merchant.",
            steps: ["Check the merchant spelling and category.", "Contact Credit Operations if the merchant is genuinely new."],
            action: { label: "Open my transactions", route: "transactions" },
            meta: "Guidance only — no merchant was added or changed."
          };
        }
        if (/\b(payment|pay)\b/.test(normalizedQuestion) && /\b(exceed|exceeds|outstanding|balance)\b/.test(normalizedQuestion)) {
          return {
            title: "The payment is above the outstanding balance",
            body: "A recorded payment cannot be greater than the card's current outstanding balance. Check the latest outstanding amount before requesting a payment.",
            steps: ["Ask MergeGuide for your outstanding balance if needed.", "Contact Credit Operations with a payment amount at or below that balance."],
            action: { label: "Open my dashboard", route: "dashboard" },
            meta: "Guidance only — no payment was created."
          };
        }
        if (/\b(expired|expiry|expire)\b/.test(normalizedQuestion)) {
          return {
            title: "The card may be expired",
            body: "An expired card cannot be used even if its saved status is Active. Check your masked card details for the expiry date, then contact Credit Operations about the next step.",
            steps: ["Ask for your current card status or card details.", "Contact Credit Operations for an approved replacement or status review."],
            action: { label: "Open my dashboard", route: "dashboard" },
            meta: "Guidance only — no card change was made."
          };
        }
        if (/\b(blocked|block)\b/.test(normalizedQuestion)) {
          return {
            title: "The card may be blocked",
            body: "A blocked card cannot be used for purchases or payments. Check your current masked card status, then contact Credit Operations if a verified review is needed.",
            steps: ["Ask for your current card status.", "Contact Credit Operations for a verified status review."],
            action: { label: "Open my dashboard", route: "dashboard" },
            meta: "Guidance only — no card status was changed."
          };
        }
        return {
          title: "Why a transaction may be declined",
          body: "A transaction needs an Active, unexpired card and a positive amount. Purchases also need a valid merchant and enough available credit; payments cannot exceed the outstanding balance.",
          steps: ["Check your card status and available credit.", "For a payment, check that the amount does not exceed the outstanding balance.", "Contact Credit Operations if the issue continues."],
          action: { label: "Open my transactions", route: "transactions" },
          meta: "Guidance only — no transaction was created."
        };
      };
      this.getCustomerDataAnswer = async (intent) => {
        const cardsResponse = await api.getCards();
        const allCards = asArray(cardsResponse);
        const cards = appState.scopeCards(allCards);
        const accountLabel = cards.length === 1 ? "one card" : `${cards.length} cards`;
        if (intent === "customer-card-details") {
          return {
            title: "Your current card details",
            body: cards.length
              ? `I found ${accountLabel} linked to your account. Card numbers are masked for privacy.`
              : "No cards are currently linked to your account.",
            steps: cards.map((card) => `${maskCardNumber(card.cardNumber)} · ${this.formatCardType(card.cardType)} · ${card.cardStatus || "Unknown status"} · expires ${formatDate(card.expiryDate)}`),
            action: { label: "Open my dashboard", route: "dashboard" },
            meta: this.liveAssistantMeta()
          };
        }
        if (intent === "customer-balances") {
          return {
            title: "Your available credit and balance",
            body: cards.length
              ? `Here is the latest balance snapshot for ${accountLabel} on your account.`
              : "No cards are currently linked to your account, so there is no balance to show.",
            steps: cards.map((card) => `${maskCardNumber(card.cardNumber)} · ${formatCurrency(card.availableCredit)} available · ${formatCurrency(card.outstandingAmount)} outstanding`),
            action: { label: "Open my dashboard", route: "dashboard" },
            meta: this.liveAssistantMeta()
          };
        }
        const transactionsResponse = await api.getTransactions();
        const transactions = appState.scopeTransactions(asArray(transactionsResponse), allCards);
        const recentTransactions = [...transactions]
          .sort((left, right) => new Date(right.transactionDateTime).getTime() - new Date(left.transactionDateTime).getTime())
          .slice(0, 5);
        return {
          title: "Your recent transactions",
          body: recentTransactions.length
            ? `Here are the latest ${recentTransactions.length} recorded transaction${recentTransactions.length === 1 ? "" : "s"} on your account.`
            : "There are no recorded transactions on your linked cards yet.",
          steps: recentTransactions.map((transaction) => `${transaction.transactionType === "PAYMENT" ? "Payment" : "Purchase"} · ${maskCardNumber(transaction.cardNumber)} · ${formatCurrency(transaction.amount)} · ${formatDateTime(transaction.transactionDateTime)} · ${transaction.status || "Recorded"}`),
          action: { label: "Open my transactions", route: "transactions" },
          meta: this.liveAssistantMeta()
        };
      };
      this.getAdminReportAnswer = async () => {
        const [cardsResponse, transactionsResponse, merchantsResponse] = await Promise.all([
          api.getCards(), api.getTransactions(), api.getMerchants()
        ]);
        const cards = asArray(cardsResponse);
        const transactions = asArray(transactionsResponse);
        const merchants = asArray(merchantsResponse);
        const today = new Date();
        const isToday = (value) => {
          const date = new Date(value);
          return !Number.isNaN(date.getTime())
            && date.getFullYear() === today.getFullYear()
            && date.getMonth() === today.getMonth()
            && date.getDate() === today.getDate();
        };
        const sumAmounts = (items) => items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const dailyTransactions = transactions.filter((transaction) => isToday(transaction.transactionDateTime));
        const dailyPurchases = dailyTransactions.filter((transaction) => transaction.transactionType === "PURCHASE");
        const dailyPayments = dailyTransactions.filter((transaction) => transaction.transactionType === "PAYMENT");
        const allPurchases = transactions.filter((transaction) => transaction.transactionType === "PURCHASE");
        const allPayments = transactions.filter((transaction) => transaction.transactionType === "PAYMENT");
        const merchantTotals = new Map();
        allPurchases.forEach((transaction) => {
          const merchantId = Number(transaction.merchantId);
          if (!Number.isFinite(merchantId)) return;
          merchantTotals.set(merchantId, (merchantTotals.get(merchantId) || 0) + Number(transaction.amount || 0));
        });
        const topMerchantEntry = [...merchantTotals.entries()].sort((left, right) => right[1] - left[1])[0];
        const topMerchant = topMerchantEntry && merchants.find((merchant) => Number(merchant.merchantId) === Number(topMerchantEntry[0]));
        const activeCards = cards.filter((card) => card.cardStatus === "ACTIVE").length;
        const blockedCards = cards.filter((card) => card.cardStatus === "BLOCKED").length;
        const todayLabel = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(today);
        const reportSteps = [
          `${todayLabel}: ${formatCurrency(sumAmounts(dailyPurchases))} in purchases across ${dailyPurchases.length} record${dailyPurchases.length === 1 ? "" : "s"}.`,
          `${todayLabel}: ${formatCurrency(sumAmounts(dailyPayments))} in payments across ${dailyPayments.length} record${dailyPayments.length === 1 ? "" : "s"}.`,
          `Portfolio cards: ${activeCards} active and ${blockedCards} blocked.`,
          `All recorded activity: ${formatCurrency(sumAmounts(allPurchases))} purchases and ${formatCurrency(sumAmounts(allPayments))} payments.`
        ];
        if (topMerchantEntry) {
          reportSteps.push(`Top purchase merchant: ${topMerchant ? topMerchant.merchantName : `Merchant #${topMerchantEntry[0]}`} with ${formatCurrency(topMerchantEntry[1])} in recorded purchases.`);
        } else {
          reportSteps.push("No recorded purchase merchant totals are available yet.");
        }
        return {
          title: "Current operations summary",
          body: "This summary is calculated from the current portal records. It contains aggregates only and does not expose customer-sensitive details.",
          steps: reportSteps,
          action: { label: "Open transactions", route: "transactions" },
          meta: this.liveAssistantMeta()
        };
      };
      this.resolveAssistantAnswer = async (question) => {
        const normalizedQuestion = helpAssistant.normalize(question);
        if (this.isCustomer() && this.isCustomerActionRequest(normalizedQuestion)) return this.makeCustomerActionAnswer();
        const dataIntent = this.getAssistantDataIntent(normalizedQuestion);
        if (dataIntent === "admin-report") return this.getAdminReportAnswer();
        if (dataIntent) return this.getCustomerDataAnswer(dataIntent);
        if (this.isCustomer() && this.isCustomerTransactionErrorQuestion(normalizedQuestion)) {
          return this.makeCustomerTransactionErrorAnswer(normalizedQuestion);
        }
        if (this.isCustomer() && /\b(purchase|purchases|payment|payments)\b/.test(normalizedQuestion)) {
          return this.makeCustomerEducationAnswer();
        }
        const answer = helpAssistant.answer(question, this.assistantRoute());
        if (this.isCustomer() && answer.action && !this.isRouteAllowed(answer.action.route)) {
          return { ...answer, action: null, meta: "Guidance only — account actions require Credit Operations." };
        }
        return answer;
      };
      this.submitAssistant = (_form, event) => {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        const question = String(this.assistantQuery() || "").trim();
        if (!question || this.assistantBusy()) return false;

        this.assistantMessages.push({
          role: "user",
          title: "",
          body: question,
          steps: [],
          action: null,
          meta: ""
        });
        this.assistantQuery("");
        this.assistantBusy(true);
        const requestVersion = ++this.assistantRequestVersion;
        this.scrollAssistantToLatest();
        void this.resolveAssistantAnswer(question)
          .then((answer) => {
            if (requestVersion !== this.assistantRequestVersion) return;
            this.assistantMessages.push({
              role: "assistant",
              title: answer.title,
              body: answer.body,
              steps: answer.steps || [],
              action: answer.action || null,
              meta: answer.meta || ""
            });
            this.assistantSuggestions(this.formatAssistantSuggestions(this.getRoleAssistantPrompts(this.assistantRoute(), 4)));
            this.assistantLiveMessage(`${answer.title}. ${answer.body}`);
          })
          .catch(() => {
            if (requestVersion !== this.assistantRequestVersion) return;
            const answer = {
              title: "I could not read that right now",
              body: "The current portal data could not be reached, so I will not guess a balance, status, or report total. Check that the backend is running, then try again.",
              steps: ["Use Refresh on the current page after the service is available.", "Try the question again once the latest data has loaded."],
              action: { label: "Refresh your view", route: this.assistantRoute() },
              meta: "No account or report data was shown."
            };
            this.assistantMessages.push({ role: "assistant", ...answer });
            this.assistantLiveMessage(`${answer.title}. ${answer.body}`);
          })
          .finally(() => {
            if (requestVersion !== this.assistantRequestVersion) return;
            this.assistantBusy(false);
            this.scrollAssistantToLatest();
          });
        return false;
      };
      this.assistantNavigate = (action) => {
        if (!action || !action.route || !this.isRouteAllowed(action.route)) return;
        this.closeAssistant();
        window.dispatchEvent(new CustomEvent("mergemaster:navigate", { detail: action.route }));
      };
      this.assistantKeyHandler = (event) => {
        if (event.key === "Escape" && this.assistantOpen()) this.closeAssistant();
      };
      document.addEventListener("keydown", this.assistantKeyHandler);

      this.goToRoute = (route) => {
        if (!this.router || !this.isRouteAllowed(route)) return;
        const navigation = this.router.go({ path: route });
        if (navigation && typeof navigation.then === "function") {
          navigation.then(() => this.refreshAssistantContext()).catch(() => {});
        } else {
          this.refreshAssistantContext();
        }
      };
      this.focusLoginInput = () => {
        window.setTimeout(() => {
          const input = document.getElementById("loginUsername");
          if (input) input.focus();
        }, 40);
      };
      this.clearLoginIntroTimers = () => {
        this.loginIntroTimers.forEach((timer) => window.clearTimeout(timer));
        this.loginIntroTimers = [];
      };
      this.finishLoginIntro = () => {
        this.clearLoginIntroTimers();
        this.loginIntroLogoVisible(false);
        this.loginIntroVisible(false);
        const next = this.loginIntroNext;
        this.loginIntroNext = null;
        if (typeof next === "function") next();
      };
      this.revealLoginIntroLogo = () => {
        if (!this.loginIntroVisible() || this.loginIntroLogoVisible()) return;
        this.loginIntroLogoVisible(true);
        this.loginIntroTimers.push(window.setTimeout(this.finishLoginIntro, 1400));
      };
      this.startLoginIntro = (next) => {
        this.clearLoginIntroTimers();
        this.loginIntroNext = typeof next === "function" ? next : null;
        this.loginIntroLogoVisible(false);
        this.loginIntroVisible(true);
        this.loginIntroTimers.push(window.setTimeout(this.revealLoginIntroLogo, 3500));
        window.setTimeout(() => {
          const video = document.querySelector(".login-intro-video");
          if (video && typeof video.play === "function") {
            video.currentTime = 0;
            const playResult = video.play();
            if (playResult && typeof playResult.catch === "function") playResult.catch(this.revealLoginIntroLogo);
          }
        }, 0);
      };
      this.setLoginHistoryState = () => {
        if (this.isAuthenticated()) return;
        const url = new URL(window.location.href);
        if (url.searchParams.get("cvLogin") === "1") return;
        url.searchParams.set("cvLogin", "1");
        window.history.pushState({ creditVaultLogin: true }, "", url.toString());
      };
      this.clearLoginHistoryState = () => {
        const url = new URL(window.location.href);
        if (url.searchParams.get("cvLogin") !== "1") return;
        url.searchParams.delete("cvLogin");
        window.history.replaceState({ creditVaultHome: true }, "", url.toString());
      };
      this.handleBrowserBack = () => {
        if (this.isAuthenticated()) return;
        const url = new URL(window.location.href);
        if (url.searchParams.get("cvLogin") === "1") return;
        this.finishLoginIntro();
        this.loginReady(false);
        this.loginError("");
        document.title = "Credit Vault";
      };
      this.enterLogin = () => {
        this.setLoginHistoryState();
        this.startLoginIntro(() => {
          this.loginReady(true);
          document.title = "Credit Vault | Sign in";
          this.focusLoginInput();
        });
      };
      this.completeLogin = (session) => {
        appState.startSession(session);
        this.loginError("");
        this.loginPassword("");
        this.customerOtp("");
        this.otpRequested(false);
        this.setupPassword("");
        this.setupConfirmPassword("");
        this.assistantOpen(false);
        this.assistantUnread(true);
        this.assistantRequestVersion += 1;
        this.assistantBusy(false);
        this.applyRoleNavigation();
        this.clearAssistantConversation();
        this.goToRoute("dashboard");
        appState.notify(`Welcome, ${session.userName}.`, "success");
      };
      this.resetCustomerLoginState = () => {
        this.loginError("");
        this.customerMobile("");
        this.customerOtp("");
        this.otpRequested(false);
        this.localCustomerOtp("");
        this.localOtpCustomer(null);
        this.setupCustomerName("");
        this.setupPassword("");
        this.setupConfirmPassword("");
      };
      this.selectLoginRole = (role) => {
        this.loginRole(role);
        this.loginError("");
        this.loginUsername("");
        this.loginPassword("");
        this.resetCustomerLoginState();
      };
      this.selectCustomerAuthMethod = (method) => {
        this.customerAuthMethod(method);
        this.loginError("");
        this.customerOtp("");
        this.otpRequested(false);
        this.localCustomerOtp("");
        this.localOtpCustomer(null);
      };
      this.maskMobileNumber = (mobileNumber) => {
        const digits = String(mobileNumber || "").replace(/\D/g, "");
        if (digits.length <= 4) return digits;
        return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
      };
      this.createDemoOtp = () => String(Math.floor(100000 + Math.random() * 900000));
      this.buildCustomerUpdateInput = (customer, password) => ({
        customerName: customer.customerName,
        password,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        panNumber: customer.panNumber
      });
      this.requestLocalCustomerOtp = async (mobile) => {
        const customers = asArray(await api.getCustomers());
        const customer = customers.find((item) => String(item.mobileNumber || "").trim() === mobile);
        if (!customer || !customer.customerId) {
          throw new Error("No customer account is registered with that mobile number.");
        }
        const otp = this.createDemoOtp();
        this.localOtpCustomer(customer);
        this.localCustomerOtp(otp);
        this.setupCustomerName(customer.customerName || "");
        return { message: `Demo OTP for ${mobile} is ${otp}.`, customerName: customer.customerName || "" };
      };
      this.setupLocalCustomerLogin = async (mobile, otp, customerName, password) => {
        const customer = this.localOtpCustomer();
        if (!customer || String(customer.mobileNumber || "").trim() !== mobile) {
          throw new Error("Request an OTP for your registered mobile number first.");
        }
        if (otp !== this.localCustomerOtp()) {
          throw new Error("Enter the correct demo OTP shown in the toast.");
        }
        if (this.normalizeLoginName(customer.customerName) !== this.normalizeLoginName(customerName)) {
          throw new Error("Customer name does not match this registered mobile number.");
        }
        const updatedCustomer = await api.updateCustomer(
          customer.customerId,
          this.buildCustomerUpdateInput(customer, password)
        );
        this.localCustomerOtp("");
        this.localOtpCustomer(null);
        return updatedCustomer;
      };
      this.persistCustomerPassword = async (customerId, password) => {
        const customers = asArray(await api.getCustomers());
        const customer = customers.find((item) => Number(item.customerId) === Number(customerId));
        if (!customer || !customer.customerId) {
          throw new Error("Password setup completed, but the customer record could not be reloaded for database update.");
        }
        if (String(customer.password || "").trim() === String(password || "").trim()) {
          return customer;
        }
        return api.updateCustomer(
          customer.customerId,
          this.buildCustomerUpdateInput(customer, password)
        );
      };
      this.loginLocalCustomer = async (customerName, password) => {
        const customers = asArray(await api.getCustomers());
        const customer = customers.find((item) => this.normalizeLoginName(item.customerName) === this.normalizeLoginName(customerName));
        if (!customer || !customer.customerId) {
          throw new Error("We could not find that customer name. If this is your first login, use First-time OTP.");
        }
        if (String(customer.password || "").trim() !== String(password || "").trim()) {
          throw new Error("The password does not match this customer account.");
        }
        return customer;
      };
      this.sendCustomerOtp = async () => {
        const mobile = String(this.customerMobile() || "").trim();
        this.loginError("");
        if (!/^\d{10,15}$/.test(mobile)) {
          this.loginError("Enter the registered mobile number with 10 to 15 digits.");
          return;
        }
        this.loginBusy(true);
        try {
          let response;
          try {
            response = await api.requestCustomerOtp({ mobileNumber: mobile });
          } catch (error) {
            if (!error || (error.status !== 404 && error.status !== 500)) throw error;
            response = await this.requestLocalCustomerOtp(mobile);
          }
          this.otpRequested(true);
          this.customerOtp("");
          this.setupCustomerName(response.customerName || "");
          appState.notify(response.message || `Demo OTP sent for ${mobile}.`, "info");
        } catch (error) {
          this.loginError(error instanceof Error ? error.message : "Could not start OTP verification.");
        } finally {
          this.loginBusy(false);
        }
      };
      this.verifyCustomerOtpAndSetup = async () => {
        const otp = String(this.customerOtp() || "").trim();
        const mobile = String(this.customerMobile() || "").trim();
        const customerName = String(this.setupCustomerName() || "").trim();
        const password = String(this.setupPassword() || "").trim();
        const confirmPassword = String(this.setupConfirmPassword() || "").trim();
        this.loginError("");
        if (!this.otpRequested()) {
          this.loginError("Request an OTP for your registered mobile number first.");
          return;
        }
        if (customerName.length < 2) {
          this.loginError("Enter the customer name exactly as saved in the database.");
          return;
        }
        if (password.length < 4) {
          this.loginError("Choose a password with at least four characters.");
          return;
        }
        if (password !== confirmPassword) {
          this.loginError("Password and confirm password must match.");
          return;
        }
        this.loginBusy(true);
        try {
          let updatedCustomer;
          try {
            updatedCustomer = await api.setupCustomerLogin({ mobileNumber: mobile, otp, customerName, password });
            updatedCustomer = await this.persistCustomerPassword(updatedCustomer.customerId, password);
          } catch (error) {
            if (!error || (error.status !== 404 && error.status !== 500)) throw error;
            updatedCustomer = await this.setupLocalCustomerLogin(mobile, otp, customerName, password);
          }
          this.completeLogin({
            role: "customer",
            userName: updatedCustomer.customerName,
            customerId: updatedCustomer.customerId
          });
        } catch (error) {
          this.loginError(error instanceof Error ? error.message : "Could not save customer login details.");
        } finally {
          this.loginBusy(false);
        }
      };
      this.submitLogin = async (_form, event) => {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        const username = String(this.loginUsername() || "").trim();
        const password = String(this.loginPassword() || "").trim();
        const normalizedUsername = this.normalizeLoginName(username);
        const normalizedPassword = this.normalizeLoginName(password);
        this.loginError("");

        if (this.loginRole() === "admin") {
          if (!username || !password) {
            this.loginError("Enter the admin username and password.");
            return false;
          }
          if (normalizedUsername !== "admin" || normalizedPassword !== "admin") {
            this.loginError("Admin credentials are not valid.");
            return false;
          }
          this.completeLogin({ role: "admin", userName: "Administrator" });
          return false;
        }
        if (this.customerAuthMethod() === "otp") {
          await this.verifyCustomerOtpAndSetup();
          return false;
        }
        if (!username || !password) {
          this.loginError("Enter your customer name and password.");
          return false;
        }
        this.loginBusy(true);
        try {
          let customer;
          try {
            customer = await api.loginCustomer({ customerName: username, password });
          } catch (error) {
            if (!error || (error.status !== 404 && error.status !== 500)) throw error;
            customer = await this.loginLocalCustomer(username, password);
          }
          this.completeLogin({
            role: "customer",
            userName: customer.customerName,
            customerId: customer.customerId
          });
        } catch (error) {
          this.loginError(error instanceof Error
            ? error.message
            : "Customer sign-in could not be completed. Please try again.");
        } finally {
          this.loginBusy(false);
        }
        return false;
      };
      this.logout = () => {
        this.sideDrawerOn(false);
        this.assistantOpen(false);
        this.assistantUnread(true);
        this.assistantRequestVersion += 1;
        this.assistantBusy(false);
        this.assistantMessages([]);
        this.assistantSuggestions([]);
        this.loginUsername("");
        this.loginPassword("");
        this.loginError("");
        this.loginReady(false);
        this.finishLoginIntro();
        this.clearLoginHistoryState();
        appState.dismissToast();
        appState.endSession();
        this.applyRoleNavigation();
        if (this.router) {
          const navigation = this.router.go({ path: "dashboard" });
          if (navigation && typeof navigation.catch === "function") navigation.catch(() => {});
        }
        document.title = "Credit Vault";
      };
      window.addEventListener("popstate", this.handleBrowserBack);
      if (!this.isAuthenticated() && new URL(window.location.href).searchParams.get("cvLogin") === "1") {
        this.loginReady(true);
        document.title = "Credit Vault | Sign in";
      }
      const initialAssistantRoute = this.getAssistantRoute();
      this.assistantRoute(initialAssistantRoute);
      this.assistantMessages([this.makeAssistantWelcome(initialAssistantRoute)]);
      this.assistantSuggestions(this.formatAssistantSuggestions(this.getRoleAssistantPrompts(initialAssistantRoute, 4)));

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

      const navData = [{ path: "", redirect: "dashboard" }, ...this.adminNavItems];
      const router = new CoreRouter(navData, { urlAdapter: new UrlParamAdapter() });
      this.router = router;
      router.beforeStateChange.subscribe((args) => {
        if (!args || !args.state) return;
        if (this.isAuthenticated() && !this.isRouteAllowed(args.state.path)) {
          args.accept(Promise.reject("This route is not available for the current account."));
        }
      });
      this.moduleAdapter = new ModuleRouterAdapter(router);
      this.selection = new KnockoutRouterAdapter(router);
      this.navDataProvider = new ArrayDataProvider(this.navItems, { keyAttributes: "path" });
      this.footerDataProvider = new ArrayDataProvider(this.footerLinks, { keyAttributes: "linkId" });
      this.motionController = new MotionController();
      this.enforceRouteAccess = (route) => {
        const requestedRoute = helpAssistant.resolveRoute(route) || this.getAssistantRoute();
        if (!this.isAuthenticated() || this.isRouteAllowed(requestedRoute)) return true;
        this.goToRoute("dashboard");
        return false;
      };
      if (this.selection.path && typeof this.selection.path.subscribe === "function") {
        this.selection.path.subscribe((route) => {
          if (this.enforceRouteAccess(route)) this.refreshAssistantContext();
        });
      }

      window.addEventListener("mergemaster:navigate", (event) => {
        const route = event.detail;
        if (!navData.some((item) => item.path === route) || !this.isRouteAllowed(route)) return;
        this.goToRoute(route);
      });

      this.applyRoleNavigation();
      const initialSync = router.sync();
      const finishInitialSync = () => {
        this.applyRoleNavigation();
        if (this.enforceRouteAccess(this.getAssistantRoute())) this.refreshAssistantContext();
      };
      const recoverInitialRoute = () => {
        this.applyRoleNavigation();
        if (this.isAuthenticated()) this.goToRoute("dashboard");
        else this.focusLoginInput();
      };
      if (initialSync && typeof initialSync.then === "function") initialSync.then(finishInitialSync).catch(recoverInitialRoute);
      else finishInitialSync();

      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }
  }

  return new RootViewModel();
});
