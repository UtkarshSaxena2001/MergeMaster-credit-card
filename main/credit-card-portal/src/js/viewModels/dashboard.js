define(["knockout", "../accUtils", "../api", "../appState"], function (ko, AccUtils, apiModule, appStateModule) {
  "use strict";

  const { api, asArray, formatCurrency, formatDate, formatDateTime, maskCardNumber } = apiModule;
  const appState = appStateModule.appState;

  class DashboardViewModel {
    constructor() {
      this.customers = ko.observableArray([]);
      this.cards = ko.observableArray([]);
      this.merchants = ko.observableArray([]);
      this.transactions = ko.observableArray([]);
      this.databaseStatus = ko.observable({
        status: "UNKNOWN",
        database: "Database",
        service: ""
      });
      this.isLoading = ko.observable(true);
      this.error = ko.observable("");
      this.isCustomer = appState.isCustomer;
      this.currentCustomerName = appState.userName;
      this.dashboardEyebrow = ko.pureComputed(() => this.isCustomer() ? "My credit account" : "Credit operations workspace");
      this.dashboardTitle = ko.pureComputed(() => this.isCustomer() ? "My card overview" : "Portfolio overview");
      this.dashboardSubtitle = ko.pureComputed(() => this.isCustomer()
        ? "Review your available credit, balances, and recent account activity."
        : "See customers, cards and account activity in one clear view.");
      this.customerCount = ko.pureComputed(() => this.isCustomer()
        ? (asArray(this.cards()).length ? 1 : 0)
        : asArray(this.customers()).length);
      this.cardCount = ko.pureComputed(() => asArray(this.cards()).length);
      this.merchantCount = ko.pureComputed(() => asArray(this.merchants()).length);
      this.transactionCount = ko.pureComputed(() => asArray(this.transactions()).length);
      this.totalCreditLimit = ko.pureComputed(() =>
        asArray(this.cards()).reduce((sum, card) => sum + Number(card.creditLimit || 0), 0));
      this.totalAvailableCredit = ko.pureComputed(() =>
        asArray(this.cards()).reduce((sum, card) => sum + Number(card.availableCredit || 0), 0));
      this.totalOutstanding = ko.pureComputed(() =>
        asArray(this.cards()).reduce((sum, card) => sum + Number(card.outstandingAmount || 0), 0));
      this.utilization = ko.pureComputed(() => {
        const limit = this.totalCreditLimit();
        return limit ? Math.min(100, Math.round((this.totalOutstanding() / limit) * 100)) : 0;
      });
      this.activeCards = ko.pureComputed(() =>
        asArray(this.cards()).filter((card) => card.cardStatus === "ACTIVE").length);
      this.recentTransactions = ko.pureComputed(() => [...asArray(this.transactions())]
        .sort((left, right) => new Date(right.transactionDateTime).getTime() - new Date(left.transactionDateTime).getTime())
        .slice(0, 6));
      this.topCard = ko.pureComputed(() => [...asArray(this.cards())].sort(
        (left, right) => Number(right.outstandingAmount) - Number(left.outstandingAmount)
      )[0]);
      this.databaseLabel = ko.pureComputed(() => {
        const connection = this.databaseStatus();
        return connection.status === "UP"
          ? `${connection.database} ${connection.service} connected`
          : "Database connection unavailable";
      });
      this.formatCurrency = formatCurrency;
      this.formatDate = formatDate;
      this.formatDateTime = formatDateTime;
      this.maskCardNumber = maskCardNumber;
      this.cardTileClass = (card) => {
        const cardType = String(card.cardType || "").trim().toUpperCase();
        const cardStatus = String(card.cardStatus || "").trim().toUpperCase();
        return {
          "credit-card-tile-blocked": cardStatus === "BLOCKED",
          "credit-card-tile-silver": cardType === "SILVER",
          "credit-card-tile-gold": cardType === "GOLD",
          "credit-card-tile-platinum": cardType === "PLATINUM"
        };
      };
      this.cardUtilization = (card) => {
        const limit = Number(card.creditLimit);
        return limit ? Math.min(100, Math.round((Number(card.outstandingAmount) / limit) * 100)) : 0;
      };
      this.refresh = async () => {
        this.isLoading(true);
        this.error("");
        try {
          const [customers, cards, merchants, transactions, databaseStatus] = await Promise.all([
            api.getCustomers(),
            api.getCards(),
            api.getMerchants(),
            api.getTransactions(),
            api.getDatabaseStatus().catch(() => ({
              status: "DOWN",
              database: "Database",
              service: ""
            }))
          ]);
          const allCustomers = asArray(customers);
          const allCards = asArray(cards);
          const allTransactions = asArray(transactions);
          const isCustomer = this.isCustomer();
          this.customers(isCustomer
            ? allCustomers.filter((customer) => Number(customer.customerId) === Number(appState.customerId()))
            : allCustomers);
          this.cards(appState.scopeCards(allCards));
          this.merchants(isCustomer ? [] : asArray(merchants));
          this.transactions(appState.scopeTransactions(allTransactions, allCards));
          this.databaseStatus(databaseStatus);
        } catch (error) {
          this.error(error instanceof Error ? error.message : "Unable to load dashboard data.");
        } finally {
          this.isLoading(false);
        }
      };
      this.navigate = (route) => window.dispatchEvent(new CustomEvent("mergemaster:navigate", { detail: route }));
      this.transactionLabel = (transaction) => transaction.transactionType === "PAYMENT" ? "Payment received" : "Purchase posted";
      this.transactionClass = (transaction) => transaction.transactionType === "PAYMENT" ? "transaction-payment" : "transaction-purchase";
    }

    connected() {
      AccUtils.announce(this.isCustomer() ? "My dashboard loaded." : "Dashboard page loaded.");
      document.title = this.isCustomer() ? "MergeMaster | My dashboard" : "MergeMaster | Dashboard";
      void this.refresh();
    }
  }

  return DashboardViewModel;
});
