define(["knockout", "../accUtils", "../api", "../appState"], function (ko, AccUtils, apiModule, appStateModule) {
  "use strict";

  const { api, asArray, formatCurrency, formatDateTime, maskCardNumber } = apiModule;
  const appState = appStateModule.appState;

  class TransactionsViewModel {
    constructor() {
      this.transactions = ko.observableArray([]);
      this.cards = ko.observableArray([]);
      this.merchants = ko.observableArray([]);
      this.isLoading = ko.observable(true);
      this.error = ko.observable("");
      this.formBusy = ko.observable(false);
      this.formError = ko.observable("");
      this.transactionType = ko.observable("PURCHASE");
      this.cardNumber = ko.observable("");
      this.merchantId = ko.observable("");
      this.amount = ko.observable("");
      this.searchText = ko.observable("");
      this.filterCard = ko.observable("");
      this.filterMerchant = ko.observable("");
      this.filterType = ko.observable("ALL");
      this.fromDate = ko.observable("");
      this.toDate = ko.observable("");
      this.selectedCard = ko.pureComputed(() => this.cards().find((card) => card.cardNumber === this.cardNumber()));
      this.cardOptions = ko.pureComputed(() => this.cards().map((card) => ({
        value: card.cardNumber,
        label: `${maskCardNumber(card.cardNumber)} · ${formatCurrency(card.availableCredit)} available`
      })));
      this.merchantOptions = ko.pureComputed(() => this.merchants().map((merchant) => ({
        value: merchant.merchantId,
        label: `${merchant.merchantName} · ${merchant.category}`
      })));
      this.filteredTransactions = ko.pureComputed(() => {
        const query = this.searchText().trim().toLowerCase();
        const from = this.fromDate() ? new Date(`${this.fromDate()}T00:00:00`) : undefined;
        const to = this.toDate() ? new Date(`${this.toDate()}T23:59:59`) : undefined;
        return [...this.transactions()].filter((transaction) => {
          const date = new Date(transaction.transactionDateTime);
          const merchant = transaction.merchantId ? this.merchantName(transaction.merchantId) : "";
          const matchesQuery = !query || [
            transaction.transactionId, transaction.cardNumber, transaction.transactionType, merchant, transaction.amount
          ].some((value) => String(value || "").toLowerCase().includes(query));
          const matchesCard = !this.filterCard() || transaction.cardNumber === this.filterCard();
          const matchesMerchant = !this.filterMerchant() || Number(transaction.merchantId) === Number(this.filterMerchant());
          const matchesType = this.filterType() === "ALL" || transaction.transactionType === this.filterType();
          return matchesQuery && matchesCard && matchesMerchant && matchesType && (!from || date >= from) && (!to || date <= to);
        }).sort((left, right) => new Date(right.transactionDateTime).getTime() - new Date(left.transactionDateTime).getTime());
      });
      this.formTypeLabel = ko.pureComputed(() => this.transactionType() === "PURCHASE" ? "Record purchase" : "Record payment");
      this.selectedCardLabel = ko.pureComputed(() => {
        const card = this.selectedCard();
        if (!card) return "Choose a card to see its available balance.";
        return card.cardStatus === "ACTIVE"
          ? `${formatCurrency(card.availableCredit)} available · ${formatCurrency(card.outstandingAmount)} outstanding`
          : "This card is blocked and cannot be used for transactions.";
      });
      this.formatCurrency = formatCurrency;
      this.formatDateTime = formatDateTime;
      this.maskCardNumber = maskCardNumber;
      this.refresh = async () => {
        this.isLoading(true);
        this.error("");
        try {
          const [transactions, cards, merchants] = await Promise.all([
            api.getTransactions(), api.getCards(), api.getMerchants()
          ]);
          this.transactions(asArray(transactions));
          this.cards(asArray(cards));
          this.merchants(asArray(merchants));
        } catch (error) {
          this.error(error instanceof Error ? error.message : "Unable to load transactions.");
        } finally {
          this.isLoading(false);
        }
      };
      this.setTransactionType = (type) => {
        this.transactionType(type);
        this.formError("");
        if (type === "PAYMENT") this.merchantId("");
      };
      this.submitForm = (_form, event) => {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        void this.postTransaction();
        return false;
      };
      this.clearFilters = () => {
        this.searchText("");
        this.filterCard("");
        this.filterMerchant("");
        this.filterType("ALL");
        this.fromDate("");
        this.toDate("");
      };
      this.merchantName = (merchantId) => {
        const merchant = this.merchants().find((item) => Number(item.merchantId) === Number(merchantId));
        return merchant ? merchant.merchantName : merchantId ? `Merchant #${merchantId}` : "—";
      };
      this.transactionClass = (transaction) => transaction.transactionType === "PAYMENT" ? "transaction-payment" : "transaction-purchase";
      this.transactionLabel = (transaction) => transaction.transactionType === "PAYMENT" ? "Payment" : "Purchase";
    }

    connected() {
      AccUtils.announce("Transactions page loaded.");
      document.title = "MergeMaster | Transactions";
      void this.refresh();
    }

    async postTransaction() {
      const card = this.selectedCard();
      const amount = Number(this.amount());
      const type = this.transactionType();
      if (!card) return this.formError("Choose a card before posting a transaction.");
      if (card.cardStatus !== "ACTIVE") return this.formError("Blocked cards cannot be used for transactions.");
      if (!Number.isFinite(amount) || amount <= 0) return this.formError("Enter an amount greater than zero.");
      if (type === "PURCHASE" && amount > Number(card.availableCredit)) {
        return this.formError("Purchase amount exceeds this card's available credit.");
      }
      if (type === "PAYMENT" && amount > Number(card.outstandingAmount)) {
        return this.formError("Payment amount cannot exceed the outstanding balance.");
      }
      const merchantId = Number(this.merchantId());
      if (type === "PURCHASE" && (!Number.isFinite(merchantId) || merchantId <= 0)) {
        return this.formError("Choose a merchant for this purchase.");
      }
      this.formBusy(true);
      this.formError("");
      try {
        if (type === "PURCHASE") {
          await api.purchase({ cardNumber: card.cardNumber, merchantId, amount });
          appState.notify("Purchase posted and available credit updated.", "success");
        } else {
          await api.payment({ cardNumber: card.cardNumber, amount });
          appState.notify("Payment posted and available credit restored.", "success");
        }
        this.amount("");
        this.merchantId("");
        await this.refresh();
      } catch (error) {
        this.formError(error instanceof Error ? error.message : "Transaction could not be posted.");
      } finally {
        this.formBusy(false);
      }
    }
  }

  return TransactionsViewModel;
});
