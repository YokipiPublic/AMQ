// ==UserScript==
// @name         AMQ FTF Remote Update
// @namespace    https://github.com/YokipiPublic/AMQ/
// @version      0.1
// @description  Adds a button to update spreadsheet with current score/rig
// @author       Yokipi
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

let ssSubmitButton;
let submitRequest;

function addButton() {
  ssSubmitButton = $(`<div id="qpSongListButton" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-wifi qpMenuItem"></i></div>`)
    .click(function () {

      // Abort any pending request
      if (submitRequest) {
          submitRequest.abort();
      }

      // Get name, score, and rig
      let names = [], scores = [], rigs = [], i = 0;
      for (let entryID in quiz.scoreboard.playerEntries) {
        let entry = quiz.scoreboard.playerEntries[entryID];
        names[i] = entry.$entry.find(".qpsPlayerName").text();
        scores[i] = entry.$score.text();
        rigs[i] = entry.$entry.find(".qpsPlayerRig").text();
        if (i++ >= 2) break;
      }

      // Create data object
      let data = {};
      data["P1"] = names[0];
      data["S1"] = scores[0];
      data["R1"] = rigs[0];
      data["P2"] = names[1];
      data["S2"] = scores[1];
      data["R2"] = rigs[1];

      // AJAX request
      submitRequest = $.ajax({
        url: "https://script.google.com/macros/s/AKfycbyQKN3iAJZMWL6gtn5_xPDs8ItQwHS_-A2tA6t2KkWwN6oZ8K8/exec",
        type: "post",
        data: data
      });

      // Callback handler that will be called on success
      submitRequest.done(function (response, textStatus, jqXHR){
          // Log a message to the console
          console.log("Spreadsheet successfully updated!");
      });

      // Callback handler that will be called on failure
      submitRequest.fail(function (jqXHR, textStatus, errorThrown){
          // Log the error to the console
          console.error("Spreadsheet failed to update: "+textStatus, errorThrown);
      });

      // Callback handler that will be called regardless
      // if the request failed or succeeded
      submitRequest.always(function () {

      });
    })
    .popover({
      placement: "bottom",
      content: "Submit current score to spreadsheet",
      trigger: "hover"
    });

  let oldWidth = $("#qpOptionContainer").width();
  $("#qpOptionContainer").width(oldWidth + 35);
  $("#qpOptionContainer > div").append(ssSubmitButton);
};

addButton();
