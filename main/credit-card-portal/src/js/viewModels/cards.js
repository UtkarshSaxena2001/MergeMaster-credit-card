define(["knockout", "../accUtils", "../api", "../appState"], function (ko, AccUtils, apiModule, appStateModule) {
  "use strict";

  const { api, asArray, formatCurrency, formatDate, maskCardNumber } = apiModule;
  const appState = appStateModule.appState;

  class CardsViewModel {
    constructor() {
      this.cards = ko.observableArray([]);
      this.customers = ko.observableArray([]);
      this.searchText = ko.observable("");
      this.isLoading = ko.observable(true);
      this.error = ko.observable("");
      this.formVisible = ko.observable(false);
      this.formBusy = ko.observable(false);
      this.formError = ko.observable("");
      this.selectedCard = ko.observable(null);
      this.editingCardNumber = ko.observable(null);
      this.cardNumber = ko.observable("");
      this.customerId = ko.observable("");
      this.cardType = ko.observable("GOLD");
      this.creditLimit = ko.observable("100000");
      this.outstandingAmount = ko.observable("0");
      this.expiryDate = ko.observable("");
      this.cardStatus = ko.observable("ACTIVE");
      this.cardTypes = ["SILVER", "GOLD", "PLATINUM"];
      this.statusOptions = ["ACTIVE", "BLOCKED"];
      this.filteredCards = ko.pureComputed(() => {
        const query = this.searchText().trim().toLowerCase();
        if (!query) return this.cards();
        return this.cards().filter((card) =>
          [card.cardNumber, card.cardType, card.cardStatus, this.customerLabel(card)]
            .some((value) => String(value || "").toLowerCase().includes(query)));
      });
      this.isEditing = ko.pureComputed(() => this.editingCardNumber() !== null);
      this.availableCredit = ko.pureComputed(() => {
        const limit = Number(this.creditLimit());
        const outstanding = Number(this.outstandingAmount());
        return Number.isFinite(limit) && Number.isFinite(outstanding) ? Math.max(0, limit - outstanding) : 0;
      });
      this.utilization = ko.pureComputed(() => {
        const limit = Number(this.creditLimit());
        const outstanding = Number(this.outstandingAmount());
        return limit > 0 && Number.isFinite(outstanding) ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;
      });
      this.customerOptions = ko.pureComputed(() => {
        const known = this.customers().map((customer) => ({
          id: customer.customerId,
          label: `${customer.customerName} · #${customer.customerId}`,
          legacy: false
        }));
        const knownIds = new Set(known.map((option) => option.id));
        this.cards().forEach((card) => {
          if (!knownIds.has(Number(card.customerId))) {
            known.push({
              id: Number(card.customerId),
              label: `Unlinked legacy customer · #${card.customerId}`,
              legacy: true
            });
            knownIds.add(Number(card.customerId));
          }
        });
        return known;
      });
      this.formatCurrency = formatCurrency;
      this.formatDate = formatDate;
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
      this.isSelectedCard = (card) => {
        const selected = this.selectedCard();
        return selected && card && String(selected.cardNumber) === String(card.cardNumber);
      };
      this.refresh = async () => {
        this.isLoading(true);
        this.error("");
        try {
          const [cards, customers] = await Promise.all([api.getCards(), api.getCustomers()]);
          this.cards(asArray(cards));
          this.customers(asArray(customers));
        } catch (error) {
          this.error(error instanceof Error ? error.message : "Unable to load cards.");
        } finally {
          this.isLoading(false);
        }
      };
      this.openCreate = () => {
        this.editingCardNumber(null);
        this.resetForm();
        this.generateCardNumber();
        this.formVisible(true);
      };
      this.openEdit = (card) => {
        this.editingCardNumber(card.cardNumber);
        this.cardNumber(card.cardNumber);
        this.customerId(card.customerId);
        this.cardType(card.cardType);
        this.creditLimit(String(card.creditLimit));
        this.outstandingAmount(String(card.outstandingAmount));
        this.expiryDate(card.expiryDate);
        this.cardStatus(card.cardStatus);
        this.formError("");
        this.formVisible(true);
      };
      this.closeForm = () => {
        this.formVisible(false);
        this.formError("");
        this.editingCardNumber(null);
      };
      this.submitForm = (_form, event) => {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        void this.save();
        return false;
      };
      this.generateCardNumber = () => {
        let base = "45";
        for (let index = 0; index < 13; index += 1) base += Math.floor(Math.random() * 10).toString();
        this.cardNumber(`${base}${this.luhnCheckDigit(base)}`);
      };
      this.deleteCard = async (card) => {
        if (!window.confirm(`Delete card ending ${card.cardNumber.slice(-4)}? This cannot be undone.`)) return;
        try {
          await api.deleteCard(card.cardNumber);
          appState.notify("Card deleted.", "success");
          await this.refresh();
        } catch (error) {
          appState.notify(error instanceof Error ? error.message : "Card could not be deleted.", "error");
        }
      };
      this.customerLabel = (card) => {
        const customer = this.customers().find((entry) => Number(entry.customerId) === Number(card.customerId));
        return customer ? customer.customerName : `Customer #${card.customerId}`;
      };
      this.cardUtilization = (card) => {
        const limit = Number(card.creditLimit);
        return limit ? Math.min(100, Math.round((Number(card.outstandingAmount) / limit) * 100)) : 0;
      };
      this.detailRows = (card) => card ? [
        { label: "Cardholder", value: this.customerLabel(card) },
        { label: "Card number", value: this.maskCardNumber(card.cardNumber) },
        { label: "Card tier", value: card.cardType },
        { label: "Status", value: card.cardStatus },
        { label: "Credit limit", value: this.formatCurrency(card.creditLimit) },
        { label: "Available credit", value: this.formatCurrency(card.availableCredit) },
        { label: "Outstanding amount", value: this.formatCurrency(card.outstandingAmount) },
        { label: "Expiry date", value: this.formatDate(card.expiryDate) },
        { label: "Utilization", value: `${this.cardUtilization(card)}%` }
      ] : [];
    }

    connected() {
      AccUtils.announce("Cards page loaded.");
      document.title = "Credit Vault | Cards";
      void this.refresh();
    }

    async save() {
      const normalizedNumber = this.cardNumber().replace(/\s/g, "");
      const customerId = Number(this.customerId());
      const creditLimit = Number(this.creditLimit());
      const outstandingAmount = Number(this.outstandingAmount());
      const validationError = this.validate(normalizedNumber, customerId, creditLimit, outstandingAmount);
      if (validationError) {
        this.formError(validationError);
        return;
      }
      const input = {
        cardNumber: normalizedNumber,
        customerId,
        cardType: this.cardType(),
        creditLimit,
        availableCredit: creditLimit - outstandingAmount,
        outstandingAmount,
        expiryDate: this.expiryDate(),
        cardStatus: this.cardStatus()
      };
      this.formBusy(true);
      this.formError("");
      try {
        const existingNumber = this.editingCardNumber();
        if (existingNumber) {
          await api.updateCard(existingNumber, input);
          appState.notify("Card settings updated.", "success");
        } else {
          await api.createCard(input);
          appState.notify("New card issued successfully.", "success");
        }
        this.selectedCard(null);
        this.closeForm();
        await this.refresh();
      } catch (error) {
        this.formError(error instanceof Error ? error.message : "Card could not be saved.");
      } finally {
        this.formBusy(false);
      }
    }

    resetForm() {
      this.cardNumber("");
      this.customerId("");
      this.cardType("GOLD");
      this.creditLimit("100000");
      this.outstandingAmount("0");
      const date = new Date();
      date.setFullYear(date.getFullYear() + 3);
      this.expiryDate(date.toISOString().slice(0, 10));
      this.cardStatus("ACTIVE");
      this.formError("");
    }

    validate(cardNumber, customerId, limit, outstanding) {
      if (!/^\d{16}$/.test(cardNumber)) return "Card number must contain exactly 16 digits.";
      if (!this.isEditing() && !this.customers().some((customer) => Number(customer.customerId) === customerId)) {
        return "Choose an existing customer before issuing a card.";
      }
      if (!Number.isFinite(customerId) || customerId <= 0) return "Choose a customer for this card.";
      if (!Number.isFinite(limit) || limit <= 0) return "Credit limit must be greater than zero.";
      if (!Number.isFinite(outstanding) || outstanding < 0) return "Outstanding balance cannot be negative.";
      if (outstanding > limit) return "Outstanding balance cannot exceed the credit limit.";
      if (!this.expiryDate()) return "Choose an expiry date.";
      return "";
    }

    luhnCheckDigit(base) {
      let sum = 0;
      let doubleDigit = true;
      for (let index = base.length - 1; index >= 0; index -= 1) {
        let digit = Number(base.charAt(index));
        if (doubleDigit) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        doubleDigit = !doubleDigit;
      }
      return (10 - (sum % 10)) % 10;
    }
  }

  return CardsViewModel;
});
