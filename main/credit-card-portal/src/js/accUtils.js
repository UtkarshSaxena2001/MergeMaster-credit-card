define([], function () {
  "use strict";

  const validAriaLiveValues = ["off", "polite", "assertive"];

  function announce(message, manner) {
    const resolvedManner = validAriaLiveValues.includes(manner) ? manner : "polite";
    const globalBodyElement = document.getElementById("globalBody");
    globalBodyElement.dispatchEvent(new CustomEvent("announce", {
      bubbles: true,
      detail: { message, manner: resolvedManner }
    }));
  }

  return { announce };
});
