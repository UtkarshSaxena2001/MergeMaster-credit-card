define(["knockout", "../accUtils", "../api", "../appState"], function (ko, AccUtils, apiModule, appStateModule) {
  "use strict";

  const { api, asArray } = apiModule;
  const appState = appStateModule.appState;

  class MerchantsViewModel {
    constructor() {
      this.merchants = ko.observableArray([]);
      this.transactions = ko.observableArray([]);
      this.searchText = ko.observable("");
      this.categoryFilter = ko.observable("ALL");
      this.isLoading = ko.observable(true);
      this.error = ko.observable("");
      this.formVisible = ko.observable(false);
      this.formBusy = ko.observable(false);
      this.formError = ko.observable("");
      this.editingId = ko.observable(null);
      this.merchantName = ko.observable("");
      this.category = ko.observable("");
      this.location = ko.observable("");
      this.categories = ko.pureComputed(() => [
        "ALL",
        ...Array.from(new Set(this.merchants().map((merchant) => merchant.category))).sort()
      ]);
      this.filteredMerchants = ko.pureComputed(() => {
        const query = this.searchText().trim().toLowerCase();
        const category = this.categoryFilter();
        return this.merchants().filter((merchant) => {
          const inCategory = category === "ALL" || merchant.category === category;
          const matchesSearch = !query || [merchant.merchantName, merchant.category, merchant.location]
            .some((value) => String(value || "").toLowerCase().includes(query));
          return inCategory && matchesSearch;
        });
      });
      this.isEditing = ko.pureComputed(() => this.editingId() !== null);
      this.refresh = async () => {
        this.isLoading(true);
        this.error("");
        try {
          const [merchants, transactions] = await Promise.all([api.getMerchants(), api.getTransactions()]);
          this.merchants(asArray(merchants));
          this.transactions(asArray(transactions));
        } catch (error) {
          this.error(error instanceof Error ? error.message : "Unable to load merchants.");
        } finally {
          this.isLoading(false);
        }
      };
      this.openCreate = () => {
        this.editingId(null);
        this.merchantName("");
        this.category("");
        this.location("");
        this.formError("");
        this.formVisible(true);
      };
      this.openEdit = (merchant) => {
        this.editingId(merchant.merchantId);
        this.merchantName(merchant.merchantName);
        this.category(merchant.category);
        this.location(merchant.location || "");
        this.formError("");
        this.formVisible(true);
      };
      this.closeForm = () => {
        this.formVisible(false);
        this.formError("");
        this.editingId(null);
      };
      this.submitForm = (_form, event) => {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        void this.save();
        return false;
      };
      this.deleteMerchant = async (merchant) => {
        if (this.transactionCount(merchant) > 0) {
          appState.notify("This merchant is referenced by transaction history and is kept to preserve the audit trail.", "error");
          return;
        }
        if (!window.confirm(`Delete ${merchant.merchantName} from the merchant directory?`)) return;
        try {
          await api.deleteMerchant(merchant.merchantId);
          appState.notify("Merchant deleted.", "success");
          await this.refresh();
        } catch (error) {
          appState.notify(error instanceof Error ? error.message : "Merchant could not be deleted.", "error");
        }
      };
      this.transactionCount = (merchant) => this.transactions().filter(
        (transaction) => Number(transaction.merchantId) === Number(merchant.merchantId)).length;
    }

    connected() {
      AccUtils.announce("Merchants page loaded.");
      document.title = "MergeMaster | Merchants";
      void this.refresh();
    }

    async save() {
      const input = {
        merchantName: this.merchantName().trim(),
        category: this.category().trim(),
        location: this.location().trim()
      };
      if (!input.merchantName || !input.category) {
        this.formError("Merchant name and category are required.");
        return;
      }
      this.formBusy(true);
      this.formError("");
      try {
        const id = this.editingId();
        if (id === null) {
          await api.createMerchant(input);
          appState.notify("Merchant added to the directory.", "success");
        } else {
          await api.updateMerchant(id, input);
          appState.notify("Merchant details updated.", "success");
        }
        this.closeForm();
        await this.refresh();
      } catch (error) {
        this.formError(error instanceof Error ? error.message : "Merchant could not be saved.");
      } finally {
        this.formBusy(false);
      }
    }
  }

  return MerchantsViewModel;
});
