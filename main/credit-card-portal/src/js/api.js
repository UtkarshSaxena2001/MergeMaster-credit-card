define([], function () {
  "use strict";

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }

  function apiBaseUrl() {
    const configured = window.localStorage.getItem("mergemaster.apiBaseUrl");
    if (configured) {
      return configured.replace(/\/$/, "");
    }
    return window.location.port === "8080" ? "" : "http://localhost:8080";
  }

  async function request(path, init) {
    let response;
    try {
      response = await fetch(`${apiBaseUrl()}${path}`, {
        headers: {
          Accept: "application/json",
          ...(init && init.body ? { "Content-Type": "application/json" } : {}),
          ...(init && init.headers ? init.headers : {})
        },
        ...(init || {})
      });
    } catch (error) {
      throw new ApiError(
        "The API could not be reached. Start the Spring Boot application on port 8080.",
        0
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json().catch(() => undefined)
      : await response.text().catch(() => "");

    if (!response.ok) {
      const message = typeof body === "object" && body && "message" in body
        ? String(body.message)
        : typeof body === "string" && body.trim()
          ? body
          : `Request failed (${response.status})`;
      throw new ApiError(message, response.status);
    }
    return body;
  }

  function jsonBody(value) {
    return { body: JSON.stringify(value) };
  }

  const api = {
    getCustomers: () => request("/api/customers"),
    createCustomer: (input) => request("/api/customers", { method: "POST", ...jsonBody(input) }),
    updateCustomer: (id, input) => request(`/api/customers/${id}`, { method: "PUT", ...jsonBody(input) }),
    deleteCustomer: (id) => request(`/api/customers/${id}`, { method: "DELETE" }),

    getCards: () => request("/api/creditcards"),
    createCard: (input) => request("/api/creditcards", { method: "POST", ...jsonBody(input) }),
    updateCard: (cardNumber, input) => request(`/api/creditcards/${encodeURIComponent(cardNumber)}`, {
      method: "PUT",
      ...jsonBody(input)
    }),
    deleteCard: (cardNumber) => request(`/api/creditcards/${encodeURIComponent(cardNumber)}`, { method: "DELETE" }),

    getMerchants: () => request("/api/merchants"),
    createMerchant: (input) => request("/api/merchants", { method: "POST", ...jsonBody(input) }),
    updateMerchant: (id, input) => request(`/api/merchants/${id}`, { method: "PUT", ...jsonBody(input) }),
    deleteMerchant: (id) => request(`/api/merchants/${id}`, { method: "DELETE" }),

    getTransactions: () => request("/api/transactions"),
    purchase: (input) => request("/api/transactions/purchase", { method: "POST", ...jsonBody(input) }),
    payment: (input) => request("/api/transactions/payment", { method: "POST", ...jsonBody(input) })
  };

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number.isFinite(amount) ? amount : 0);
  }

  function maskCardNumber(cardNumber) {
    const digits = String(cardNumber || "").replace(/\s/g, "");
    return digits.length < 8 ? digits : `•••• ${digits.slice(-4)}`;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    }).format(date);
  }

  function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  return { api, ApiError, formatCurrency, formatDate, formatDateTime, maskCardNumber };
});
