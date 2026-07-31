define(["knockout", "../accUtils", "../api"], function (ko, AccUtils, apiModule) {
  "use strict";

  const { api, asArray, formatCurrency, formatDateTime, maskCardNumber } = apiModule;

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
      this.customerCount = ko.pureComputed(() => asArray(this.customers()).length);
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
      this.formatDateTime = formatDateTime;
      this.maskCardNumber = maskCardNumber;
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
          this.customers(asArray(customers));
          this.cards(asArray(cards));
          this.merchants(asArray(merchants));
          this.transactions(asArray(transactions));
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
      AccUtils.announce("Dashboard page loaded.");
      document.title = "MergeMaster | Dashboard";
      void this.refresh();
    }
  }

  return DashboardViewModel;
});
