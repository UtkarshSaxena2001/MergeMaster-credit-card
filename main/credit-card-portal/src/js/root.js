define([
  "knockout",
  "ojs/ojbootstrap",
  "ojs/ojconfig",
  "ojs/ojcspexpressionevaluator",
  "./appController",
  "ojs/ojknockout",
  "ojs/ojmodule",
  "ojs/ojnavigationlist",
  "ojs/ojbutton",
  "ojs/ojtoolbar"
], function (ko, Bootstrap, Config, CspExpressionEvaluator, rootViewModel) {
  "use strict";

  Config.setExpressionEvaluator(new CspExpressionEvaluator({
    globalScope: { oj: window.oj }
  }));

  function init() {
    ko.applyBindings(rootViewModel, document.getElementById("globalBody"));
  }

  Bootstrap.whenDocumentReady().then(function () {
    if (document.body.classList.contains("oj-hybrid")) {
      document.addEventListener("deviceready", init);
    } else {
      init();
    }
  });
});
