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
      this.selectedCard = ko.observable(null);
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
      this.blockedCards = ko.pureComputed(() =>
        asArray(this.cards()).filter((card) => card.cardStatus === "BLOCKED").length);
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
      this.creditScore = ko.pureComputed(() => {
        const tiers = asArray(this.cards()).map((card) => String(card.cardType || "").toUpperCase());
        if (tiers.includes("PLATINUM")) return 800;
        if (tiers.includes("GOLD")) return 700;
        if (tiers.includes("SILVER")) return 620;
        return 580;
      });
      this.creditScoreBand = ko.pureComputed(() => {
        const score = this.creditScore();
        if (score >= 780) return "Excellent";
        if (score >= 700) return "Good";
        if (score >= 620) return "Fair";
        return "Starter";
      });
      this.creditScoreWidth = ko.pureComputed(() => `${Math.min(100, Math.max(0, Math.round((this.creditScore() / 900) * 100)))}%`);
      this.activeCards = ko.pureComputed(() =>
        asArray(this.cards()).filter((card) => card.cardStatus === "ACTIVE").length);
      this.adminRiskLevel = ko.pureComputed(() => {
        const blocked = this.blockedCards();
        const total = this.cardCount();
        if (!total) return "No cards";
        const blockedRate = blocked / total;
        const used = this.utilization();
        if (blockedRate >= .25 || used >= 75) return "High attention";
        if (blockedRate >= .1 || used >= 45) return "Moderate";
        return "Healthy";
      });
      this.adminRiskWidth = ko.pureComputed(() => {
        const blockedRate = this.cardCount() ? (this.blockedCards() / this.cardCount()) * 100 : 0;
        return `${Math.min(100, Math.max(6, Math.round((this.utilization() * .65) + (blockedRate * .35))))}%`;
      });
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
      this.formatFullCardNumber = (cardNumber) => String(cardNumber || "").replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
      this.cardTileClass = (card) => {
        const cardType = String(card && card.cardType || "").trim().toUpperCase();
        const cardStatus = String(card && card.cardStatus || "").trim().toUpperCase();
        return {
          "credit-card-tile-blocked": cardStatus === "BLOCKED",
          "credit-card-tile-silver": cardType === "SILVER",
          "credit-card-tile-gold": cardType === "GOLD",
          "credit-card-tile-platinum": cardType === "PLATINUM"
        };
      };
      this.cardUtilization = (card) => {
        const limit = Number(card && card.creditLimit);
        const outstanding = Number(card && card.outstandingAmount);
        return limit && Number.isFinite(outstanding) ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;
      };
      this.selectCard = (card) => {
        this.selectedCard(card);
      };
      this.selectCardFromKeyboard = (card, event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.selectCard(card);
        }
        return true;
      };
      this.closeCardDetails = () => {
        this.selectedCard(null);
      };
      this.detailRows = (card) => card ? [
        { label: "Cardholder", value: this.currentCustomerName() },
        { label: "Full card number", value: this.formatFullCardNumber(card.cardNumber) },
        { label: "Card tier", value: card.cardType },
        { label: "Credit score", value: `${this.scoreForCard(card)} · ${this.scoreBandForCard(card)}` },
        { label: "Status", value: card.cardStatus },
        { label: "Credit limit", value: this.formatCurrency(card.creditLimit) },
        { label: "Available credit", value: this.formatCurrency(card.availableCredit) },
        { label: "Outstanding amount", value: this.formatCurrency(card.outstandingAmount) },
        { label: "Expiry date", value: this.formatDate(card.expiryDate) },
        { label: "Utilization", value: `${this.cardUtilization(card)}%` }
      ] : [];
      this.scoreForCard = (card) => {
        const cardType = String(card && card.cardType || "").toUpperCase();
        if (cardType === "PLATINUM") return 800;
        if (cardType === "GOLD") return 700;
        if (cardType === "SILVER") return 620;
        return 580;
      };
      this.scoreBandForCard = (card) => {
        const score = this.scoreForCard(card);
        if (score >= 780) return "Excellent";
        if (score >= 700) return "Good";
        if (score >= 620) return "Fair";
        return "Starter";
      };
      this.monthlyTransactionGraph = ko.pureComputed(() => {
        const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short" });
        const now = new Date();
        const buckets = [];
        for (let index = 5; index >= 0; index -= 1) {
          const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
          buckets.push({
            key: `${date.getFullYear()}-${date.getMonth()}`,
            label: monthFormatter.format(date),
            purchase: 0,
            payment: 0,
            total: 0,
            height: "0%"
          });
        }
        asArray(this.transactions()).forEach((transaction) => {
          const date = new Date(transaction.transactionDateTime);
          if (Number.isNaN(date.getTime())) return;
          const bucket = buckets.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`);
          if (!bucket) return;
          const amount = Number(transaction.amount || 0);
          if (transaction.transactionType === "PAYMENT") bucket.payment += amount;
          else bucket.purchase += amount;
          bucket.total += amount;
        });
        const max = Math.max(1, ...buckets.map((bucket) => bucket.total));
        return buckets.map((bucket) => ({
          ...bucket,
          height: `${Math.max(7, Math.round((bucket.total / max) * 100))}%`,
          totalLabel: this.formatCurrency(bucket.total)
        }));
      });
      this.transactionSplit = ko.pureComputed(() => {
        const purchase = asArray(this.transactions())
          .filter((transaction) => transaction.transactionType === "PURCHASE")
          .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
        const payment = asArray(this.transactions())
          .filter((transaction) => transaction.transactionType === "PAYMENT")
          .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
        const total = purchase + payment || 1;
        return [
          { label: "Purchases", value: this.formatCurrency(purchase), width: `${Math.round((purchase / total) * 100)}%`, tone: "purchase" },
          { label: "Payments", value: this.formatCurrency(payment), width: `${Math.round((payment / total) * 100)}%`, tone: "payment" }
        ];
      });
      this.cardStatusMix = ko.pureComputed(() => {
        const total = this.cardCount() || 1;
        return [
          { label: "Active", value: this.activeCards(), width: `${Math.round((this.activeCards() / total) * 100)}%`, tone: "payment" },
          { label: "Blocked", value: this.blockedCards(), width: `${Math.round((this.blockedCards() / total) * 100)}%`, tone: "purchase" }
        ];
      });
      this.cardMix = ko.pureComputed(() => {
        const cards = asArray(this.cards());
        return ["PLATINUM", "GOLD", "SILVER"].map((type) => {
          const count = cards.filter((card) => String(card.cardType || "").toUpperCase() === type).length;
          return {
            type,
            tone: type.toLowerCase(),
            count,
            width: `${cards.length ? Math.max(8, Math.round((count / cards.length) * 100)) : 0}%`
          };
        }).filter((item) => item.count > 0);
      });
      this.topMerchants = ko.pureComputed(() => {
        const totals = new Map();
        asArray(this.transactions())
          .filter((transaction) => transaction.transactionType === "PURCHASE" && transaction.merchantId !== null && transaction.merchantId !== undefined)
          .forEach((transaction) => {
            const merchantId = Number(transaction.merchantId);
            totals.set(merchantId, (totals.get(merchantId) || 0) + Number(transaction.amount || 0));
          });
        const max = Math.max(1, ...totals.values());
        return [...totals.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([merchantId, amount]) => {
            const merchant = asArray(this.merchants()).find((item) => Number(item.merchantId) === merchantId);
            return {
              name: merchant ? merchant.merchantName : `Merchant #${merchantId}`,
              value: this.formatCurrency(amount),
              width: `${Math.max(8, Math.round((amount / max) * 100))}%`
            };
          });
      });
      this.adminSnapshot = ko.pureComputed(() => [
        { label: "Customers", value: this.customerCount(), note: "verified records" },
        { label: "Merchants", value: this.merchantCount(), note: "purchase partners" },
        { label: "Blocked cards", value: this.blockedCards(), note: "need review" },
        { label: "Utilization", value: `${this.utilization()}%`, note: "portfolio used" }
      ]);
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
      document.title = this.isCustomer() ? "Credit Vault | My dashboard" : "Credit Vault | Dashboard";
      void this.refresh();
    }
  }

  return DashboardViewModel;
});
