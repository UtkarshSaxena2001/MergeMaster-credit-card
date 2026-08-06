define(["knockout", "../accUtils", "../api", "../appState"], function (ko, AccUtils, apiModule, appStateModule) {
  "use strict";

  const { api, asArray, maskCardNumber } = apiModule;
  const appState = appStateModule.appState;

  class CustomersViewModel {
    constructor() {
      this.customers = ko.observableArray([]);
      this.cards = ko.observableArray([]);
      this.searchText = ko.observable("");
      this.isLoading = ko.observable(true);
      this.error = ko.observable("");
      this.formVisible = ko.observable(false);
      this.formBusy = ko.observable(false);
      this.formError = ko.observable("");
      this.databaseStatus = ko.observable({
        status: "CHECKING",
        database: "Unknown",
        service: "",
        apiBaseUrl: api.getApiBaseUrl()
      });
      this.editingId = ko.observable(null);
      this.customerName = ko.observable("");
      this.password = ko.observable("");
      this.email = ko.observable("");
      this.mobileNumber = ko.observable("");
      this.panNumber = ko.observable("");
      this.filteredCustomers = ko.pureComputed(() => {
        const query = this.searchText().trim().toLowerCase();
        if (!query) return this.customers();
        return this.customers().filter((customer) =>
          [customer.customerName, customer.email, customer.mobileNumber, customer.panNumber]
            .some((value) => String(value || "").toLowerCase().includes(query)));
      });
      this.isEditing = ko.pureComputed(() => this.editingId() !== null);
      this.refresh = async () => {
        this.isLoading(true);
        this.error("");
        try {
          const [customers, cards] = await Promise.all([api.getCustomers(), api.getCards()]);
          this.customers(asArray(customers));
          this.cards(asArray(cards));
          await this.refreshDatabaseStatus();
        } catch (error) {
          this.error(error instanceof Error ? error.message : "Unable to load customers.");
        } finally {
          this.isLoading(false);
        }
      };
      this.openCreate = () => {
        this.editingId(null);
        this.resetForm();
        this.formVisible(true);
      };
      this.openEdit = (customer) => {
        this.editingId(customer.customerId);
        this.customerName(customer.customerName);
        this.password(customer.password || "");
        this.email(customer.email);
        this.mobileNumber(customer.mobileNumber);
        this.panNumber(customer.panNumber);
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
      this.deleteCustomer = async (customer) => {
        if (this.isLinkedToCard(customer)) {
          appState.notify("This customer has an issued card. Remove or reassign the card before deleting them.", "error");
          return;
        }
        if (!window.confirm(`Delete ${customer.customerName} from the customer directory?`)) return;
        try {
          await api.deleteCustomer(customer.customerId);
          appState.notify("Customer deleted.", "success");
          await this.refresh();
        } catch (error) {
          appState.notify(error instanceof Error ? error.message : "Customer could not be deleted.", "error");
        }
      };
      this.isLinkedToCard = (customer) => this.linkedCards(customer).length > 0;
      this.linkedCards = (customer) => this.cards().filter(
        (card) => Number(card.customerId) === Number(customer.customerId));
      this.linkedCardLabel = (customer) => {
        const linked = this.linkedCards(customer);
        if (!linked.length) return "No cards issued";
        const preview = linked.slice(0, 2).map((card) => maskCardNumber(card.cardNumber)).join(", ");
        return `${linked.length} card${linked.length === 1 ? "" : "s"}: ${preview}`;
      };
    }

    connected() {
      AccUtils.announce("Customers page loaded.");
      document.title = "Credit Vault | Customers";
      void this.refresh();
    }

    async save() {
      const input = {
        customerName: this.customerName().trim(),
        email: this.email().trim(),
        mobileNumber: this.mobileNumber().trim(),
        panNumber: this.panNumber().trim().toUpperCase()
      };
      if (this.isEditing()) {
        input.password = this.password().trim();
      }
      const validationError = this.validate(input);
      if (validationError) {
        this.formError(validationError);
        return;
      }
      const duplicateError = this.findDuplicate(input, this.editingId());
      if (duplicateError) {
        this.formError(duplicateError);
        return;
      }
      this.formBusy(true);
      this.formError("");
      try {
        const id = this.editingId();
        if (id === null) {
          await api.createCustomer(input);
          appState.notify("Customer added to the directory.", "success");
        } else {
          await api.updateCustomer(id, input);
          appState.notify("Customer details updated.", "success");
        }
        this.closeForm();
        await this.refresh();
      } catch (error) {
        this.formError(error instanceof Error ? error.message : "Customer could not be saved.");
      } finally {
        this.formBusy(false);
      }
    }

    async refreshDatabaseStatus() {
      try {
        const status = await api.getDatabaseStatus();
        this.databaseStatus({
          ...status,
          apiBaseUrl: api.getApiBaseUrl()
        });
      } catch (error) {
        this.databaseStatus({
          status: "DOWN",
          database: "Unavailable",
          service: "",
          apiBaseUrl: api.getApiBaseUrl()
        });
      }
    }

    resetForm() {
      this.customerName("");
      this.password("");
      this.email("");
      this.mobileNumber("");
      this.panNumber("");
      this.formError("");
    }

    validate(input) {
      if (input.customerName.length < 2) return "Enter a customer name of at least two characters.";
      if (input.password && input.password.length > 100) return "Password cannot exceed 100 characters.";
      if (!/^\S+@\S+\.\S+$/.test(input.email)) return "Enter a valid email address.";
      if (!/^\d{10,15}$/.test(input.mobileNumber)) return "Mobile number must contain 10 to 15 digits.";
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(input.panNumber)) return "PAN must follow the format ABCDE1234F.";
      return "";
    }

    findDuplicate(input, editingId) {
      const normalizedEmail = input.email.toLowerCase();
      const normalizedPan = input.panNumber.toUpperCase();
      const existing = this.customers().filter((customer) => Number(customer.customerId) !== Number(editingId));
      if (existing.some((customer) => String(customer.email || "").trim().toLowerCase() === normalizedEmail)) {
        return "Email is already registered";
      }
      if (existing.some((customer) => String(customer.mobileNumber || "").trim() === input.mobileNumber)) {
        return "Mobile number is already registered";
      }
      if (existing.some((customer) => String(customer.panNumber || "").trim().toUpperCase() === normalizedPan)) {
        return "PAN number is already registered";
      }
      return "";
    }
  }

  return CustomersViewModel;
});
