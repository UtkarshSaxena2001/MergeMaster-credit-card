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

      window.addEventListener("mergemaster:navigate", (event) => {
        const route = event.detail;
        if (navData.some((item) => item.path === route)) void router.go({ path: route });
      });

      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }
  }

  return new RootViewModel();
});
