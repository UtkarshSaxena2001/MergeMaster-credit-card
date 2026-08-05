define(["knockout"], function (ko) {
  "use strict";

  const SESSION_STORAGE_KEY = "mergemaster.operatorSession";

  function readStoredSession() {
    try {
      const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      const session = JSON.parse(stored);
      if (!session || (session.role !== "admin" && session.role !== "customer")) return null;
      if (!session.userName || (session.role === "customer" && !session.customerId)) return null;
      return {
        role: session.role,
        userName: String(session.userName),
        customerId: session.role === "customer" ? Number(session.customerId) : null
      };
    } catch (error) {
      return null;
    }
  }

  function persistSession(session) {
    try {
      if (session) window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      else window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      // Session storage can be unavailable in privacy-restricted browser contexts.
    }
  }

  class AppState {
    constructor() {
      this.toastMessage = ko.observable("");
      this.toastKind = ko.observable("info");
      this.toastVisible = ko.observable(false);
      this.toastTimer = undefined;
      this.session = ko.observable(readStoredSession());
      this.isAuthenticated = ko.pureComputed(() => Boolean(this.session()));
      this.isAdmin = ko.pureComputed(() => {
        const session = this.session();
        return Boolean(session && session.role === "admin");
      });
      this.isCustomer = ko.pureComputed(() => {
        const session = this.session();
        return Boolean(session && session.role === "customer");
      });
      this.userName = ko.pureComputed(() => {
        const session = this.session();
        return session ? session.userName : "";
      });
      this.customerId = ko.pureComputed(() => {
        const session = this.session();
        return session && session.role === "customer" ? session.customerId : null;
      });
      this.roleLabel = ko.pureComputed(() => this.isAdmin() ? "Administrator" : this.isCustomer() ? "Customer" : "");
      this.dismissToast = () => {
        this.toastVisible(false);
        if (this.toastTimer !== undefined) {
          window.clearTimeout(this.toastTimer);
          this.toastTimer = undefined;
        }
      };

      this.startSession = (session) => {
        const normalized = {
          role: session.role,
          userName: String(session.userName || ""),
          customerId: session.role === "customer" ? Number(session.customerId) : null
        };
        this.session(normalized);
        persistSession(normalized);
      };

      this.endSession = () => {
        this.session(null);
        persistSession(null);
      };

      this.scopeCards = (cards) => {
        const source = Array.isArray(cards) ? cards : [];
        if (!this.isCustomer()) return source;
        const customerId = Number(this.customerId());
        return source.filter((card) => Number(card.customerId) === customerId);
      };

      this.scopeTransactions = (transactions, cards) => {
        const source = Array.isArray(transactions) ? transactions : [];
        if (!this.isCustomer()) return source;
        const cardNumbers = new Set(this.scopeCards(cards).map((card) => String(card.cardNumber)));
        return source.filter((transaction) => cardNumbers.has(String(transaction.cardNumber)));
      };
    }

    notify(message, kind = "info") {
      this.toastMessage(message);
      this.toastKind(kind);
      this.toastVisible(true);
      if (this.toastTimer !== undefined) window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => this.dismissToast(), 5000);
    }
  }

  return { appState: new AppState() };
});
