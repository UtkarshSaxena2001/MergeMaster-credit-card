define(["knockout"], function (ko) {
  "use strict";

  class AppState {
    constructor() {
      this.toastMessage = ko.observable("");
      this.toastKind = ko.observable("info");
      this.toastVisible = ko.observable(false);
      this.toastTimer = undefined;
      this.dismissToast = () => {
        this.toastVisible(false);
        if (this.toastTimer !== undefined) {
          window.clearTimeout(this.toastTimer);
          this.toastTimer = undefined;
        }
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
