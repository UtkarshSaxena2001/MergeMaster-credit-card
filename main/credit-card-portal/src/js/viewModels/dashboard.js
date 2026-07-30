define(["knockout", "../accUtils", "../api"], function (ko, AccUtils, apiModule) {
  "use strict";

  const { api, formatCurrency, formatDateTime, maskCardNumber } = apiModule;

  class DashboardViewModel {
    constructor() {
      this.customers = ko.observableArray([]);
      this.cards = ko.observableArray([]);
      this.merchants = ko.observableArray([]);
      this.transactions = ko.observableArray([]);
      this.isLoading = ko.observable(true);
      this.error = ko.observable("");
      this.customerCount = ko.pureComputed(() => this.customers().length);
      this.cardCount = ko.pureComputed(() => this.cards().length);
      this.merchantCount = ko.pureComputed(() => this.merchants().length);
      this.transactionCount = ko.pureComputed(() => this.transactions().length);
      this.totalCreditLimit = ko.pureComputed(() =>
        this.cards().reduce((sum, card) => sum + Number(card.creditLimit || 0), 0));
      this.totalAvailableCredit = ko.pureComputed(() =>
        this.cards().reduce((sum, card) => sum + Number(card.availableCredit || 0), 0));
      this.totalOutstanding = ko.pureComputed(() =>
        this.cards().reduce((sum, card) => sum + Number(card.outstandingAmount || 0), 0));
      this.utilization = ko.pureComputed(() => {
        const limit = this.totalCreditLimit();
        return limit ? Math.min(100, Math.round((this.totalOutstanding() / limit) * 100)) : 0;
      });
      this.activeCards = ko.pureComputed(() =>
        this.cards().filter((card) => card.cardStatus === "ACTIVE").length);
      this.recentTransactions = ko.pureComputed(() => [...this.transactions()]
        .sort((left, right) => new Date(right.transactionDateTime).getTime() - new Date(left.transactionDateTime).getTime())
        .slice(0, 6));
      this.topCard = ko.pureComputed(() => [...this.cards()].sort(
        (left, right) => Number(right.outstandingAmount) - Number(left.outstandingAmount)
      )[0]);
      this.formatCurrency = formatCurrency;
      this.formatDateTime = formatDateTime;
      this.maskCardNumber = maskCardNumber;
      this.refresh = async () => {
        this.isLoading(true);
        this.error("");
        try {
          const [customers, cards, merchants, transactions] = await Promise.all([
            api.getCustomers(), api.getCards(), api.getMerchants(), api.getTransactions()
          ]);
          this.customers(customers);
          this.cards(cards);
          this.merchants(merchants);
          this.transactions(transactions);
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
