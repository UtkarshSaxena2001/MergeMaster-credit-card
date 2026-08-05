/**
 * Local, route-aware help content for MergeMaster.
 *
 * This module deliberately has no UI, network, or Knockout dependency.  It is
 * safe to load from appController and can also be reused by individual views.
 *
 * Public API:
 *   normalize(text)                         -> normalized string
 *   tokenize(text)                          -> useful normalized terms
 *   resolveRoute(route)                     -> known route or empty string
 *   getSuggestedPrompts(route, limit)       -> [{ id, text, route }]
 *   search(question, route, limit)          -> ranked answer objects
 *   matchQuestion(question, route)          -> best match metadata or null
 *   answer(question, route) / getAnswer(...) -> answer object (always)
 *   getFallback(route)                      -> route-aware fallback answer
 *   getKnowledgeBase()                      -> defensive copy of the content
 *   createAssistant()                       -> small bound-route facade
 */
define([], function () {
  "use strict";

  var DEFAULT_ROUTE = "dashboard";
  var DEFAULT_SUGGESTION_LIMIT = 4;
  var DEFAULT_SEARCH_LIMIT = 5;

  var ROUTES = {
    dashboard: {
      label: "Dashboard",
      description: "portfolio health, available credit, and recent activity",
      aliases: ["dashboard", "home", "overview", "portfolio"],
      prompts: [
        "What does the dashboard show?",
        "How is portfolio utilization calculated?",
        "How do I refresh dashboard data?"
      ]
    },
    customers: {
      label: "Customers",
      description: "customer records and contact details",
      aliases: ["customer", "customers", "client", "clients", "customer directory"],
      prompts: [
        "How do I add a customer?",
        "What customer details are required?",
        "Why can’t I delete a customer?",
        "How do I find a customer record?"
      ]
    },
    cards: {
      label: "Cards",
      description: "card issuing, credit limits, and card settings",
      aliases: ["card", "cards", "credit card", "credit cards", "card portfolio"],
      prompts: [
        "How do I issue a card?",
        "What is available credit?",
        "Why is my card transaction rejected?",
        "How do I generate a card number?"
      ]
    },
    merchants: {
      label: "Merchants",
      description: "merchant partners used for card purchases",
      aliases: ["merchant", "merchants", "merchant directory", "partner", "partners"],
      prompts: [
        "How do I add a merchant?",
        "Why can’t I delete a merchant?",
        "How do I filter merchants by category?"
      ]
    },
    transactions: {
      label: "Transactions",
      description: "purchases, payments, and transaction history",
      aliases: ["transaction", "transactions", "activity", "payment", "payments", "purchase", "purchases", "ledger"],
      prompts: [
        "How do I post a purchase?",
        "How do I record a payment?",
        "Why will a transaction not post?",
        "How do I filter transaction history?"
      ]
    }
  };

  /*
   * The knowledge base uses plain text only so its answers can be safely bound
   * with Knockout's `text` binding.  `routes` represents the best destination
   * for an answer, while `action` is intentionally optional.
   */
  var KNOWLEDGE_BASE = [
    {
      id: "getting-started",
      title: "Getting started in MergeMaster",
      body: "A simple setup flow is to create a customer, issue a card, add merchant partners, then record purchases or payments.",
      steps: [
        "Open Customers and add the cardholder’s details.",
        "Open Cards and issue a card for that customer.",
        "Add a merchant before posting a purchase.",
        "Use Transactions to record purchases and payments."
      ],
      action: { label: "Open Customers", route: "customers" },
      routes: ["dashboard", "customers", "cards", "merchants", "transactions"],
      keywords: ["start", "getting", "begin", "setup", "use", "website", "app", "workflow"],
      phrases: ["how do i use", "how to use", "get started", "where do i start", "use this website", "use this app"],
      minimumMatches: 1
    },
    {
      id: "dashboard-overview",
      title: "What the dashboard shows",
      body: "The dashboard gives a portfolio-level snapshot of total credit limit, available credit, outstanding balance, utilization, managed cards, and recent transaction activity.",
      steps: [
        "Review the metric cards for portfolio totals.",
        "Use the utilization panel to compare outstanding and available credit.",
        "Use recent activity to jump to the full transaction workspace."
      ],
      action: { label: "Open Dashboard", route: "dashboard" },
      routes: ["dashboard"],
      keywords: ["dashboard", "overview", "portfolio", "summary", "metric", "metrics", "home"],
      phrases: ["what does the dashboard show", "dashboard show", "portfolio overview"],
      minimumMatches: 1
    },
    {
      id: "dashboard-utilization",
      title: "Understanding portfolio utilization",
      body: "Utilization is the share of total credit limit that is currently outstanding. Lower utilization generally means more available credit across the portfolio.",
      steps: [
        "Compare outstanding balance with total credit limit.",
        "Review the utilization bar on the dashboard.",
        "Open Cards to check utilization for an individual card."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["dashboard", "cards"],
      keywords: ["utilization", "used", "usage", "outstanding", "percentage", "percent"],
      phrases: ["portfolio utilization", "how is utilization calculated", "what is utilization", "credit utilization"],
      minimumMatches: 1
    },
    {
      id: "refresh-data",
      title: "Refreshing data",
      body: "Use the Refresh button on the current page to load the latest information from the connected API. Each workspace keeps its own refresh control near the page heading or toolbar.",
      steps: [
        "Select Refresh on the page you are viewing.",
        "Wait for the loading indicator to finish.",
        "If an error remains, check that the backend and Oracle database are running."
      ],
      action: null,
      routes: ["dashboard", "customers", "cards", "merchants", "transactions"],
      keywords: ["refresh", "reload", "latest", "update", "stale", "sync"],
      phrases: ["refresh data", "reload data", "update the page", "latest data"],
      minimumMatches: 1
    },
    {
      id: "add-customer",
      title: "Add a customer",
      body: "Create the customer record before issuing a card. MergeMaster asks for a name, email address, mobile number, and PAN number.",
      steps: [
        "Open Customers.",
        "Select Add customer.",
        "Enter the customer’s details and PAN number.",
        "Select Add customer to save the record."
      ],
      action: { label: "Open Customers", route: "customers" },
      routes: ["customers"],
      keywords: ["add", "create", "new", "register", "customer", "customer record", "client"],
      phrases: ["add a customer", "create a customer", "new customer", "register customer"],
      minimumMatches: 2
    },
    {
      id: "edit-customer",
      title: "Edit a customer record",
      body: "Use Edit in the customer table to update a customer’s name, contact details, or PAN number.",
      steps: [
        "Open Customers and locate the record.",
        "Select Edit beside that customer.",
        "Update the required fields.",
        "Select Save changes."
      ],
      action: { label: "Open Customers", route: "customers" },
      routes: ["customers"],
      keywords: ["edit", "update", "change", "customer", "record", "client"],
      phrases: ["edit customer", "update customer", "change customer details"],
      minimumMatches: 2
    },
    {
      id: "delete-customer",
      title: "Why a customer cannot be deleted",
      body: "A customer with an issued card cannot be deleted. Remove or reassign the linked card first, then return to Customers and delete the record.",
      steps: [
        "Check the customer’s linked-card label in the customer directory.",
        "Open Cards and manage the linked card if necessary.",
        "Return to Customers and select Delete once no card is linked."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["customers", "cards"],
      keywords: ["delete", "remove", "cannot", "cant", "unable", "customer", "linked", "card"],
      phrases: ["delete customer", "cannot delete customer", "cant delete customer", "remove customer"],
      minimumMatches: 2
    },
    {
      id: "find-customer",
      title: "Find a customer",
      body: "Use the search box in Customers to find records by name, email, mobile number, or PAN number.",
      steps: [
        "Open Customers.",
        "Type a name, email, mobile number, or PAN number in Search.",
        "Use Edit beside a matching record if you need to change it."
      ],
      action: { label: "Open Customers", route: "customers" },
      routes: ["customers"],
      keywords: ["find", "search", "lookup", "locate", "customer", "email", "mobile", "pan"],
      phrases: ["find customer", "search customer", "look up customer", "customer record"],
      minimumMatches: 2
    },
    {
      id: "issue-card",
      title: "Issue a card",
      body: "A card can be issued only after its customer record exists. Choose the cardholder, card tier, status, credit limit, opening balance, and expiry date before saving.",
      steps: [
        "Open Cards and select Issue card.",
        "Enter or generate a 16-digit card number.",
        "Choose an existing customer and complete the card settings.",
        "Select Issue card to add it to the portfolio."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["cards", "customers"],
      keywords: ["issue", "add", "create", "new", "card", "credit card", "cardholder"],
      phrases: ["issue a card", "add a card", "create a card", "new card", "get a card"],
      minimumMatches: 2
    },
    {
      id: "generate-card-number",
      title: "Generate a card number",
      body: "When issuing a new card, select Generate beside the card-number field to fill in a 16-digit number. You can also enter a valid 16-digit number yourself.",
      steps: [
        "Open Cards and select Issue card.",
        "Find the Card number field.",
        "Select Generate, then complete the remaining card settings."
      ],
      action: { label: "Issue a Card", route: "cards" },
      routes: ["cards"],
      keywords: ["generate", "number", "card", "digit", "digits", "16"],
      phrases: ["generate card number", "card number", "16 digit card number"],
      minimumMatches: 2
    },
    {
      id: "available-credit",
      title: "What available credit means",
      body: "Available credit is the remaining amount a card can use. It is the credit limit minus the card’s outstanding balance. A payment increases available credit; a purchase reduces it.",
      steps: [
        "Open Cards to view available credit for each card.",
        "Use the card editor to review the credit limit and outstanding balance.",
        "Record a payment in Transactions to reduce the outstanding balance."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["cards", "transactions", "dashboard"],
      keywords: ["available", "credit", "limit", "balance", "remaining", "outstanding"],
      phrases: ["available credit", "what is available credit", "credit limit", "remaining credit"],
      minimumMatches: 2
    },
    {
      id: "manage-card",
      title: "Manage an existing card",
      body: "Use Manage on a card tile to update its tier, status, credit limit, opening or outstanding balance, and expiry date. The card number is kept fixed for an existing card.",
      steps: [
        "Open Cards and find the card tile.",
        "Select Manage.",
        "Update the permitted settings.",
        "Select Save card."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["cards"],
      keywords: ["manage", "edit", "update", "change", "card", "status", "expiry", "limit"],
      phrases: ["manage card", "edit card", "update card", "change card limit", "block card"],
      minimumMatches: 2
    },
    {
      id: "add-merchant",
      title: "Add a merchant",
      body: "Add a merchant partner before recording a purchase. Merchant records contain a name, category, and an optional location.",
      steps: [
        "Open Merchants.",
        "Select Add merchant.",
        "Enter the merchant name and category, plus a location if useful.",
        "Select Add merchant to save it."
      ],
      action: { label: "Open Merchants", route: "merchants" },
      routes: ["merchants", "transactions"],
      keywords: ["add", "create", "new", "merchant", "partner", "store"],
      phrases: ["add a merchant", "create a merchant", "new merchant", "add merchant"],
      minimumMatches: 2
    },
    {
      id: "delete-merchant",
      title: "Why a merchant cannot be deleted",
      body: "A merchant with transaction history cannot be deleted, so the audit trail stays intact. Merchants with no activity can be deleted from the merchant directory.",
      steps: [
        "Check the Activity column in Merchants.",
        "Keep merchants that are linked to recorded transactions.",
        "Use Delete only for merchants with no activity."
      ],
      action: { label: "Open Merchants", route: "merchants" },
      routes: ["merchants", "transactions"],
      keywords: ["delete", "remove", "cannot", "cant", "unable", "merchant", "partner", "activity", "transaction"],
      phrases: ["delete merchant", "cannot delete merchant", "cant delete merchant", "remove merchant"],
      minimumMatches: 2
    },
    {
      id: "filter-merchants",
      title: "Filter or find merchants",
      body: "Use the merchant search box for a name, category, or location. The category filter narrows the directory to one category at a time.",
      steps: [
        "Open Merchants.",
        "Type a merchant name, category, or location in Search.",
        "Choose a category from the filter when you want a narrower list."
      ],
      action: { label: "Open Merchants", route: "merchants" },
      routes: ["merchants"],
      keywords: ["find", "search", "filter", "merchant", "category", "location", "partner"],
      phrases: ["filter merchants", "search merchants", "merchant category", "find merchant"],
      minimumMatches: 2
    },
    {
      id: "post-purchase",
      title: "Post a purchase",
      body: "A purchase records spending against an active card and reduces its available credit. Select a card, a merchant, and a positive amount, then post the transaction.",
      steps: [
        "Open Transactions and keep Purchase selected.",
        "Choose a card and merchant.",
        "Enter the purchase amount.",
        "Select Post purchase."
      ],
      action: { label: "Open Transactions", route: "transactions" },
      routes: ["transactions", "cards", "merchants"],
      keywords: ["post", "record", "add", "purchase", "spend", "spending", "buy", "merchant", "transaction"],
      phrases: ["post a purchase", "record a purchase", "add purchase", "make a purchase"],
      minimumMatches: 2
    },
    {
      id: "record-payment",
      title: "Record a payment",
      body: "A payment reduces the card’s outstanding balance and restores available credit. Select Payment, choose the card, enter the amount, and post it.",
      steps: [
        "Open Transactions and select Payment.",
        "Choose the card receiving the payment.",
        "Enter the payment amount.",
        "Select Post payment."
      ],
      action: { label: "Open Transactions", route: "transactions" },
      routes: ["transactions", "cards"],
      keywords: ["post", "record", "add", "payment", "pay", "repay", "repayment", "settle"],
      phrases: ["record a payment", "post a payment", "make a payment", "add payment"],
      minimumMatches: 2
    },
    {
      id: "purchase-versus-payment",
      title: "Purchase versus payment",
      body: "Use Purchase for card spending at a merchant. Use Payment when money is paid back to a card. Purchases increase the outstanding balance; payments reduce it.",
      steps: [
        "Choose Purchase for a merchant transaction.",
        "Choose Payment when no merchant needs to be selected.",
        "Review the card’s available credit after posting."
      ],
      action: { label: "Open Transactions", route: "transactions" },
      routes: ["transactions", "cards"],
      keywords: ["difference", "versus", "vs", "purchase", "payment", "type", "transaction"],
      phrases: ["purchase versus payment", "purchase vs payment", "difference between purchase and payment", "how do purchases and payments work", "transaction type"],
      minimumMatches: 2
    },
    {
      id: "filter-transactions",
      title: "Filter transaction history",
      body: "The transaction workspace can be filtered by free-text search, card, merchant, transaction type, and date range. Use Clear filters to reset every filter.",
      steps: [
        "Open Transactions.",
        "Set one or more filters above the transaction table.",
        "Use Clear filters to return to the complete history."
      ],
      action: { label: "Open Transactions", route: "transactions" },
      routes: ["transactions"],
      keywords: ["filter", "search", "history", "transaction", "date", "merchant", "card", "clear"],
      phrases: ["filter transactions", "transaction history", "search transactions", "clear filters", "find transaction"],
      minimumMatches: 2
    },
    {
      id: "customer-requirements",
      title: "Customer details and validation",
      body: "A customer needs a name with at least two characters, a valid unique email address, a 10 to 15 digit mobile number, and a PAN in ABCDE1234F format. All of these values must be unique where required.",
      steps: [
        "Check the name, email, mobile number, and PAN fields.",
        "Use digits only for the mobile number.",
        "Use five capital letters, four digits, and one capital letter for PAN.",
        "Check that the email, mobile number, and PAN are not already registered."
      ],
      action: { label: "Open Customers", route: "customers" },
      routes: ["customers"],
      keywords: ["customer", "name", "email", "mobile", "pan", "format", "valid", "required", "requirement", "save"],
      phrases: ["customer requirements", "customer details", "what customer details are required", "pan format", "pan number format", "customer validation", "cannot save customer", "cant save customer"],
      minimumMatches: 2
    },
    {
      id: "transaction-not-posting",
      title: "Why a transaction will not post",
      body: "Transactions need an active, unexpired card and a positive amount. Purchases also need a merchant and enough available credit. Payments do not need a merchant, but they cannot exceed the card's outstanding balance.",
      steps: [
        "Confirm the selected card is Active and has not expired.",
        "Use Purchase only when a merchant is selected.",
        "Keep a purchase at or below the available credit.",
        "Keep a payment at or below the outstanding balance."
      ],
      action: { label: "Open Transactions", route: "transactions" },
      routes: ["transactions", "cards"],
      keywords: ["transaction", "post", "rejected", "reject", "declined", "failed", "blocked", "expired", "purchase", "payment", "merchant", "active"],
      phrases: ["transaction rejected", "transaction declined", "transaction not post", "transaction will not post", "why is my card transaction rejected", "purchase rejected", "payment rejected", "blocked card transaction"],
      minimumMatches: 2
    },
    {
      id: "card-status",
      title: "Block or activate a card",
      body: "Use Manage on a card tile to change its status between Active and Blocked. A blocked card cannot be used for purchases or payments.",
      steps: [
        "Open Cards and find the relevant card.",
        "Select Manage.",
        "Change Status to Active or Blocked.",
        "Select Save card."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["cards", "transactions"],
      keywords: ["block", "unblock", "activate", "active", "blocked", "status", "card"],
      phrases: ["block a card", "unblock a card", "activate a card", "card status", "blocked card"],
      minimumMatches: 2
    },
    {
      id: "delete-card",
      title: "Why a card cannot be deleted",
      body: "Cards with recorded transactions are retained to protect the audit trail. A card without transaction history can be deleted from its card tile.",
      steps: [
        "Open Cards and find the card tile.",
        "Use Delete only when the card has no transaction history.",
        "Keep cards with recorded activity so the history remains intact."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["cards", "transactions"],
      keywords: ["delete", "remove", "cannot", "cant", "card", "transaction", "history", "audit"],
      phrases: ["delete card", "cannot delete card", "cant delete card", "remove card", "card audit trail"],
      minimumMatches: 2
    },
    {
      id: "oracle-credentials",
      title: "Oracle sign-in error",
      body: "ORA-01017 means Oracle rejected the configured database username or password. It is a backend connection issue, not a portal styling or browser issue.",
      steps: [
        "Confirm the intended Oracle username and service are being used.",
        "Clear any old password value from the current terminal session before restarting the backend helper.",
        "Enter the correct password only at the protected terminal prompt; never paste it into MergeGuide."
      ],
      action: null,
      routes: ["dashboard", "customers", "cards", "merchants", "transactions"],
      keywords: ["ora", "01017", "oracle", "credential", "credentials", "password", "username", "logon", "denied"],
      phrases: ["ora 01017", "invalid credential", "logon denied", "oracle password", "oracle credentials"],
      minimumMatches: 2
    },
    {
      id: "card-status-meaning",
      title: "What Active and Blocked mean",
      body: "An Active card can be used when it is not expired and has enough available credit. A Blocked card cannot be used for purchases or payments until Credit Operations verifies and changes its status.",
      steps: [
        "Customers can ask MergeGuide for their current masked card status.",
        "Administrators can use Cards to verify and manage an approved status change.",
        "A card that has expired also cannot be used, even if its saved status says Active."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["dashboard", "cards", "transactions"],
      keywords: ["active", "blocked", "status", "meaning", "expired", "expiry", "card"],
      phrases: ["what does active mean", "what does blocked mean", "active and blocked", "card status meaning", "what is active card", "what is blocked card"],
      minimumMatches: 2
    },
    {
      id: "card-expiry",
      title: "Checking a card expiry date",
      body: "A card cannot be used after its expiry date. Customers can ask for their current card details in MergeGuide, while administrators can check the expiry date on the relevant card tile.",
      steps: [
        "Customers: ask for your current card status or card details.",
        "Administrators: open Cards and locate the masked card tile.",
        "Arrange a replacement through the approved operations process before expiry."
      ],
      action: { label: "Open Cards", route: "cards" },
      routes: ["dashboard", "cards", "transactions"],
      keywords: ["expiry", "expire", "expired", "expiration", "date", "card"],
      phrases: ["card expiry", "card expiry date", "when does my card expire", "expired card", "card expiration"],
      minimumMatches: 2
    },
    {
      id: "merchant-not-found",
      title: "When a merchant is not found",
      body: "A purchase can only be recorded against a merchant that exists in the merchant directory. Check the merchant spelling and category, then add the merchant through the approved admin workflow if it is genuinely new.",
      steps: [
        "Search Merchants by name, category, or location.",
        "Check for a matching existing merchant before creating another record.",
        "Customers should contact Credit Operations rather than adding or changing merchants."
      ],
      action: { label: "Open Merchants", route: "merchants" },
      routes: ["merchants", "transactions"],
      keywords: ["merchant", "not found", "missing", "unknown", "purchase", "search"],
      phrases: ["merchant not found", "merchant missing", "cannot find merchant", "merchant does not exist", "unknown merchant"],
      minimumMatches: 2
    },
    {
      id: "operations-reports",
      title: "Operations report summary",
      body: "Administrators can ask MergeGuide for a current aggregate summary of daily purchases, daily payments, active and blocked cards, and the top purchase merchant. The assistant returns totals only, not sensitive customer records.",
      steps: [
        "Ask for today's transaction summary or the top purchase merchant.",
        "Use Transactions to investigate the underlying recorded activity.",
        "Use Customers, Cards, or Merchants for approved record-level work."
      ],
      action: { label: "Open Transactions", route: "transactions" },
      routes: ["dashboard", "transactions", "merchants"],
      keywords: ["report", "summary", "daily", "total", "totals", "top", "merchant", "purchase", "payment"],
      phrases: ["report summary", "daily report", "daily totals", "transaction summary", "top merchant", "highest purchases", "purchase totals", "payment totals"],
      minimumMatches: 2
    },
    {
      id: "chat-safety",
      title: "Safe use of MergeGuide",
      body: "MergeGuide provides guidance and permitted read-only summaries. It does not guess balances or statuses, reveal full card numbers or PANs, or create purchases, payments, card changes, or account changes from a chat message.",
      steps: [
        "Ask for guidance or a permitted current summary.",
        "Use the portal's verified workflows for approved operations.",
        "Never enter passwords, PANs, or full card numbers in the chat."
      ],
      action: null,
      routes: ["dashboard", "customers", "cards", "merchants", "transactions"],
      keywords: ["safe", "safety", "privacy", "secure", "sensitive", "password", "pan", "guess"],
      phrases: ["is chat safe", "what should i not share", "what customer data should stay private", "customer data privacy", "can you make a payment", "can you change my card", "do not guess", "sensitive data"],
      minimumMatches: 1
    },
    {
      id: "connection-troubleshooting",
      title: "When data will not load",
      body: "A loading or connection error usually means the API or Oracle database is unavailable. Start the backend, confirm Oracle is running, then use Refresh in the affected workspace.",
      steps: [
        "Confirm the backend is running on its configured local port.",
        "Confirm Oracle Database is running and the configured credentials are valid.",
        "Return to the page and select Refresh.",
        "Check the error message if the problem continues."
      ],
      action: { label: "Open Dashboard", route: "dashboard" },
      routes: ["dashboard", "customers", "cards", "merchants", "transactions"],
      keywords: ["error", "failed", "failure", "connection", "connect", "loading", "load", "api", "database", "oracle", "backend", "offline"],
      phrases: ["data will not load", "cannot load", "unable to load", "api not connected", "database not connected", "connection error"],
      minimumMatches: 1
    }
  ];

  var WORD_ALIASES = {
    "adding": "add",
    "added": "add",
    "creates": "create",
    "creating": "create",
    "created": "create",
    "customers": "customer",
    "clients": "client",
    "cards": "card",
    "merchants": "merchant",
    "partners": "partner",
    "purchases": "purchase",
    "payments": "payment",
    "transactions": "transaction",
    "records": "record",
    "recording": "record",
    "filters": "filter",
    "filtering": "filter",
    "searching": "search",
    "finding": "find",
    "updated": "update",
    "updating": "update",
    "deleted": "delete",
    "deleting": "delete",
    "removed": "remove",
    "removing": "remove",
    "cannot": "cant",
    "can't": "cant",
    "couldn't": "cant",
    "won't": "cant",
    "doesn't": "cant",
    "didn't": "cant",
    "refreshing": "refresh",
    "reloading": "reload"
  };

  var STOP_WORDS = {
    "a": true,
    "an": true,
    "and": true,
    "are": true,
    "be": true,
    "can": true,
    "do": true,
    "for": true,
    "how": true,
    "i": true,
    "in": true,
    "is": true,
    "it": true,
    "me": true,
    "my": true,
    "of": true,
    "on": true,
    "please": true,
    "the": true,
    "this": true,
    "to": true,
    "website": true,
    "what": true,
    "where": true,
    "with": true,
    "would": true,
    "you": true
  };

  var NAVIGATION_TERMS = {
    "go": true,
    "navigate": true,
    "open": true,
    "show": true,
    "take": true,
    "visit": true,
    "page": true,
    "screen": true,
    "where": true,
    "find": true
  };

  function asText(value) {
    if (value === null || value === undefined) return "";
    return String(value);
  }

  function stripDiacritics(value) {
    /* String.normalize is not present in every browser supported by old JET builds. */
    if (typeof value.normalize === "function") {
      return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return value;
  }

  function normalize(text) {
    return stripDiacritics(asText(text))
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\s+/g, " ");
  }

  function uniquePush(list, value) {
    if (list.indexOf(value) === -1) list.push(value);
  }

  function tokenize(text, includeStopWords) {
    var normalized = normalize(text);
    var rawTokens = normalized ? normalized.split(" ") : [];
    var result = [];
    var index;
    var token;

    for (index = 0; index < rawTokens.length; index += 1) {
      token = WORD_ALIASES[rawTokens[index]] || rawTokens[index];
      if (!token || (!includeStopWords && STOP_WORDS[token])) continue;
      uniquePush(result, token);
    }
    return result;
  }

  function unbox(value) {
    if (typeof value !== "function") return value;
    try {
      return value();
    } catch (error) {
      return "";
    }
  }

  function resolveRoute(route) {
    var value = unbox(route);
    var routeText;
    var normalizedRoute;
    var key;
    var aliases;
    var aliasIndex;

    if (value && typeof value === "object") {
      value = unbox(value.path) || unbox(value.route) || unbox(value.name) || "";
    }
    routeText = normalize(value);
    if (!routeText) return "";
    normalizedRoute = routeText.split(" ")[0];

    if (ROUTES[normalizedRoute]) return normalizedRoute;
    for (key in ROUTES) {
      if (Object.prototype.hasOwnProperty.call(ROUTES, key)) {
        aliases = ROUTES[key].aliases;
        for (aliasIndex = 0; aliasIndex < aliases.length; aliasIndex += 1) {
          if (normalize(aliases[aliasIndex]) === routeText || normalize(aliases[aliasIndex]) === normalizedRoute) {
            return key;
          }
        }
      }
    }
    return "";
  }

  function routeForContext(route) {
    return resolveRoute(route) || DEFAULT_ROUTE;
  }

  function getRouteLabel(route) {
    var resolved = resolveRoute(route);
    return resolved && ROUTES[resolved] ? ROUTES[resolved].label : "MergeMaster";
  }

  function hasWholePhrase(text, phrase) {
    var normalizedPhrase = normalize(phrase);
    if (!normalizedPhrase) return false;
    return (" " + text + " ").indexOf(" " + normalizedPhrase + " ") !== -1;
  }

  function questionMentionsRoute(question, route) {
    var normalizedQuestion = normalize(question);
    var aliases = ROUTES[route] ? ROUTES[route].aliases : [];
    var index;

    for (index = 0; index < aliases.length; index += 1) {
      if (hasWholePhrase(normalizedQuestion, aliases[index])) return true;
    }
    return false;
  }

  function getMentionedRoute(question) {
    var route;
    var aliases;
    var aliasIndex;
    var alias;
    var bestRoute = "";
    var bestAliasWordCount = 0;
    for (route in ROUTES) {
      if (!Object.prototype.hasOwnProperty.call(ROUTES, route)) continue;
      aliases = ROUTES[route].aliases;
      for (aliasIndex = 0; aliasIndex < aliases.length; aliasIndex += 1) {
        alias = normalize(aliases[aliasIndex]);
        if (hasWholePhrase(normalize(question), alias) && countWords(alias) > bestAliasWordCount) {
          bestRoute = route;
          bestAliasWordCount = countWords(alias);
        }
      }
    }
    return bestRoute;
  }

  function containsRoute(item, route) {
    return item.routes.indexOf(route) !== -1;
  }

  function countWords(value) {
    var normalized = normalize(value);
    return normalized ? normalized.split(" ").length : 0;
  }

  function calculateConfidence(score, exactPhraseCount, matchCount) {
    var confidence = 0.3 + Math.min(score, 46) / 65;
    if (exactPhraseCount > 0) confidence += 0.12;
    if (matchCount > 2) confidence += 0.05;
    return Math.max(0, Math.min(0.98, Math.round(confidence * 100) / 100));
  }

  function scoreItem(item, normalizedQuestion, terms, activeRoute) {
    var score = 0;
    var matchedKeywords = [];
    var matchedPhrases = [];
    var keywordIndex;
    var phraseIndex;
    var termIndex;
    var keyword;
    var phrase;
    var itemKeywordTerms;
    var itemTermIndex;
    var matchesKeyword;
    var matchesTerm;

    for (phraseIndex = 0; phraseIndex < item.phrases.length; phraseIndex += 1) {
      phrase = normalize(item.phrases[phraseIndex]);
      if (phrase && hasWholePhrase(normalizedQuestion, phrase)) {
        uniquePush(matchedPhrases, phrase);
        score += 18 + Math.min(countWords(phrase), 4) * 2;
      }
    }

    for (keywordIndex = 0; keywordIndex < item.keywords.length; keywordIndex += 1) {
      keyword = normalize(item.keywords[keywordIndex]);
      itemKeywordTerms = tokenize(keyword);
      matchesKeyword = itemKeywordTerms.length > 0;

      for (itemTermIndex = 0; itemTermIndex < itemKeywordTerms.length && matchesKeyword; itemTermIndex += 1) {
        matchesTerm = false;
        for (termIndex = 0; termIndex < terms.length; termIndex += 1) {
          if (terms[termIndex] === itemKeywordTerms[itemTermIndex]) {
            matchesTerm = true;
            break;
          }
        }
        if (!matchesTerm) matchesKeyword = false;
      }

      if (matchesKeyword) {
        uniquePush(matchedKeywords, keyword);
        score += itemKeywordTerms.length > 1 ? 11 : 9;
      }
    }

    if (containsRoute(item, activeRoute)) score += 2;
    if (matchedPhrases.length && containsRoute(item, activeRoute)) score += 2;

    return {
      item: item,
      score: score,
      matchedKeywords: matchedKeywords,
      matchedPhrases: matchedPhrases,
      confidence: calculateConfidence(score, matchedPhrases.length, matchedKeywords.length)
    };
  }

  function compareMatches(first, second) {
    if (second.score !== first.score) return second.score - first.score;
    if (second.matchedPhrases.length !== first.matchedPhrases.length) {
      return second.matchedPhrases.length - first.matchedPhrases.length;
    }
    if (second.matchedKeywords.length !== first.matchedKeywords.length) {
      return second.matchedKeywords.length - first.matchedKeywords.length;
    }
    return first.item.title.localeCompare(second.item.title);
  }

  function isUsefulMatch(match) {
    var minimumMatches = match.item.minimumMatches || 2;
    if (match.matchedPhrases.length > 0) return true;
    if (match.matchedKeywords.length >= minimumMatches) return true;
    return match.item.minimumMatches === 1 && match.matchedKeywords.length === 1 && match.score >= 10;
  }

  function copyArray(source) {
    return source ? source.slice(0) : [];
  }

  function copyAction(action) {
    if (!action) return null;
    return {
      label: action.label,
      route: action.route,
      type: "navigate"
    };
  }

  function makeAnswer(match, activeRoute) {
    var item = match.item;
    return {
      id: item.id,
      title: item.title,
      body: item.body,
      steps: copyArray(item.steps),
      action: copyAction(item.action),
      route: item.action && item.action.route ? item.action.route : (item.routes[0] || activeRoute),
      confidence: match.confidence,
      matched: true,
      fallback: false,
      matchedKeywords: copyArray(match.matchedKeywords),
      matchedPhrases: copyArray(match.matchedPhrases),
      suggestions: getSuggestedPrompts(activeRoute, DEFAULT_SUGGESTION_LIMIT)
    };
  }

  function makeNavigationAnswer(route, activeRoute) {
    var routeData = ROUTES[route];
    return {
      id: "navigate-" + route,
      title: "Open " + routeData.label,
      body: "The " + routeData.label + " page is where you manage " + routeData.description + ".",
      steps: [
        "Choose " + routeData.label + " from the main navigation.",
        "Use the page actions and search tools to continue."
      ],
      action: { label: "Open " + routeData.label, route: route, type: "navigate" },
      route: route,
      confidence: 0.97,
      matched: true,
      fallback: false,
      matchedKeywords: [routeData.label.toLowerCase()],
      matchedPhrases: [],
      suggestions: getSuggestedPrompts(route || activeRoute, DEFAULT_SUGGESTION_LIMIT)
    };
  }

  function getFallback(route) {
    var activeRoute = routeForContext(route);
    var routeData = ROUTES[activeRoute];
    return {
      id: "fallback",
      title: "I can help with MergeMaster",
      body: "I can explain how to use " + routeData.label + ", or guide you through customers, cards, merchants, transactions, and dashboard data.",
      steps: ["Try one of the suggested questions, or ask in everyday words."],
      action: null,
      route: activeRoute,
      confidence: 0,
      matched: false,
      fallback: true,
      matchedKeywords: [],
      matchedPhrases: [],
      suggestions: getSuggestedPrompts(activeRoute, DEFAULT_SUGGESTION_LIMIT)
    };
  }

  function isNavigationQuestion(question, terms, mentionedRoute) {
    var index;
    var aliases;
    var normalizedQuestion;
    if (!mentionedRoute) return false;
    for (index = 0; index < terms.length; index += 1) {
      if (NAVIGATION_TERMS[terms[index]]) return true;
    }
    if (terms.length === 1) return true;

    normalizedQuestion = normalize(question);
    aliases = ROUTES[mentionedRoute].aliases;
    for (index = 0; index < aliases.length; index += 1) {
      if (normalize(aliases[index]) === normalizedQuestion) return true;
    }
    return false;
  }

  function getMatches(question, route) {
    var normalizedQuestion = normalize(unbox(question));
    var terms = tokenize(normalizedQuestion);
    var activeRoute = routeForContext(route);
    var matches = [];
    var index;
    var match;

    if (!normalizedQuestion || !terms.length) {
      return { normalizedQuestion: normalizedQuestion, terms: terms, activeRoute: activeRoute, matches: matches };
    }

    for (index = 0; index < KNOWLEDGE_BASE.length; index += 1) {
      match = scoreItem(KNOWLEDGE_BASE[index], normalizedQuestion, terms, activeRoute);
      if (match.score > 0 && isUsefulMatch(match)) matches.push(match);
    }
    matches.sort(compareMatches);

    return { normalizedQuestion: normalizedQuestion, terms: terms, activeRoute: activeRoute, matches: matches };
  }

  function search(question, route, limit) {
    var matchData = getMatches(question, route);
    var maxResults = Number(limit);
    var results = [];
    var index;

    if (!isFinite(maxResults) || maxResults < 1) maxResults = DEFAULT_SEARCH_LIMIT;
    maxResults = Math.floor(maxResults);
    for (index = 0; index < matchData.matches.length && index < maxResults; index += 1) {
      results.push(makeAnswer(matchData.matches[index], matchData.activeRoute));
    }
    return results;
  }

  function matchQuestion(question, route) {
    var matchData = getMatches(question, route);
    var bestMatch = matchData.matches[0];
    if (!bestMatch) return null;
    return {
      id: bestMatch.item.id,
      score: bestMatch.score,
      confidence: bestMatch.confidence,
      matchedKeywords: copyArray(bestMatch.matchedKeywords),
      matchedPhrases: copyArray(bestMatch.matchedPhrases),
      route: bestMatch.item.action && bestMatch.item.action.route ? bestMatch.item.action.route : bestMatch.item.routes[0],
      answer: makeAnswer(bestMatch, matchData.activeRoute)
    };
  }

  function answer(question, route) {
    var matchData = getMatches(question, route);
    var mentionedRoute = getMentionedRoute(matchData.normalizedQuestion);

    if (isNavigationQuestion(matchData.normalizedQuestion, matchData.terms, mentionedRoute)) {
      return makeNavigationAnswer(mentionedRoute, matchData.activeRoute);
    }
    if (matchData.matches.length) return makeAnswer(matchData.matches[0], matchData.activeRoute);
    return getFallback(matchData.activeRoute);
  }

  function getSuggestedPrompts(route, limit) {
    var activeRoute = routeForContext(route);
    var maxResults = Number(limit);
    var result = [];
    var seen = [];
    var routePrompts = ROUTES[activeRoute].prompts;
    var genericPrompts = [
      "How do I get started?",
      "How do I refresh data?",
      "What should I do if data will not load?"
    ];
    var sources = [routePrompts, genericPrompts];
    var sourceIndex;
    var promptIndex;
    var prompt;

    if (!isFinite(maxResults) || maxResults < 1) maxResults = DEFAULT_SUGGESTION_LIMIT;
    maxResults = Math.floor(maxResults);

    for (sourceIndex = 0; sourceIndex < sources.length && result.length < maxResults; sourceIndex += 1) {
      for (promptIndex = 0; promptIndex < sources[sourceIndex].length && result.length < maxResults; promptIndex += 1) {
        prompt = sources[sourceIndex][promptIndex];
        if (seen.indexOf(prompt) === -1) {
          seen.push(prompt);
          result.push({
            id: activeRoute + "-prompt-" + result.length,
            text: prompt,
            route: activeRoute
          });
        }
      }
    }
    return result;
  }

  function getKnowledgeBase() {
    var result = [];
    var index;
    var item;
    for (index = 0; index < KNOWLEDGE_BASE.length; index += 1) {
      item = KNOWLEDGE_BASE[index];
      result.push({
        id: item.id,
        title: item.title,
        body: item.body,
        steps: copyArray(item.steps),
        action: copyAction(item.action),
        routes: copyArray(item.routes),
        keywords: copyArray(item.keywords),
        phrases: copyArray(item.phrases)
      });
    }
    return result;
  }

  function createAssistant(initialRoute) {
    var currentRoute = routeForContext(initialRoute);
    return {
      setRoute: function (route) {
        currentRoute = routeForContext(route);
        return currentRoute;
      },
      getRoute: function () {
        return currentRoute;
      },
      getSuggestedPrompts: function (limit) {
        return getSuggestedPrompts(currentRoute, limit);
      },
      search: function (question, limit) {
        return search(question, currentRoute, limit);
      },
      matchQuestion: function (question) {
        return matchQuestion(question, currentRoute);
      },
      answer: function (question) {
        return answer(question, currentRoute);
      },
      getFallback: function () {
        return getFallback(currentRoute);
      }
    };
  }

  return {
    normalize: normalize,
    tokenize: tokenize,
    resolveRoute: resolveRoute,
    getRouteLabel: getRouteLabel,
    getSuggestedPrompts: getSuggestedPrompts,
    search: search,
    matchQuestion: matchQuestion,
    answer: answer,
    getAnswer: answer,
    getFallback: getFallback,
    getKnowledgeBase: getKnowledgeBase,
    createAssistant: createAssistant
  };
});
