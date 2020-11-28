// ==UserScript==
// @name         AMQ Velocity Button
// @namespace    https://github.com/YokipiPublic/AMQ/
// @version      1.0.0
// @description  Adds a button to update spreadsheet with current scoreboard
// @author       Yokipi
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==

let velocityButton;
let submitRequest;

function addButton() {
  velocityButton = $(`<div id="qpSongListButton" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-tachometer qpMenuItem"></i></div>`)
    .click(function () {

      // Abort any pending request
      if (submitRequest) {
        console.log("Aborting previous submission");
        submitRequest.abort();
      }

      // Get name, score
      let names = [], scores = [], i = 0;
      for (let entryID in quiz.scoreboard.playerEntries) {
        let entry = quiz.scoreboard.playerEntries[entryID];
        names[i] = entry.$entry.find(".qpsPlayerName").text();
        scores[i++] = entry.$score.text();
      }

      // Create data object
      let data = {};
      data.names = names.join(",");
      data.scores = scores.join(",");

      // Assign URL
      let reject = 0;
      let url = "https://script.google.com/macros/s/AKfycbwhpKOEInJxN9XzZzuWBynRQ729_Je2FG5Ee7rRwLsYZ-m-MNo/exec";

      // Beginning of AJAX, if no rejections
      if (!reject) {

        // AJAX request
        console.log("Sending AJAX request")
        submitRequest = $.ajax({
            url: url,
            type: "post",
            data: data
        });

        // Callback handler that will be called on success
        submitRequest.done(function (response, textStatus, jqXHR) {
            if (response.result == "ERROR") {
              if (response.error.includes("repeated entry")) {
                displayRejection(Rejections.DUPLICATE);
              } else {
                displayMessage("Failed to submit for unknown reasons.\nServer may be busy, please try again.");
                console.log("Rejected by GAS.");
                console.error(response);
              }
            } else {
              displayMessage("Game successfully submitted!");
              console.log("Submission attempt successful!");
            }
        });

        // Callback handler that will be called on failure
        submitRequest.fail(function (jqXHR, textStatus, errorThrown) {
            displayMessage("Failed to submit for unknown reasons.\nServer may be busy, please try again.");
            console.error("Submission attempt failed: "+textStatus, errorThrown);
        });

        // Callback handler that will be called regardless
        // if the request failed or succeeded
        submitRequest.always(function () {

        });
      } else {
        displayRejection(reject);
      }
    })
    .popover({
      placement: "bottom",
      content: "Submit current score to spreadsheet",
      trigger: "hover"
    });

  let oldWidth = $("#qpOptionContainer").width();
  $("#qpOptionContainer").width(oldWidth + 35);
  $("#qpOptionContainer > div").append(velocityButton);
};

addButton();

// Display reason for rejection
function displayRejection(e) {
  let rejtype = "Unknown";
  switch (e) {
    case 1: rejtype = "Unexpected game mode"; break;
    case 2: rejtype = "Unexpected number of songs"; break;
    case 3: rejtype = "Unexpected number of players"; break;
    case 4: rejtype = "Game not yet finished"; break;
    case 5: rejtype = "Rig not found, please make sure the rig tracker is running"; break;
    case 6: rejtype = "Duplicate submission"; break;
    case 7: rejtype = "Unexpected number of lives"; break;
  }
  displayMessage("Submission rejected:\n" + rejtype);
  console.log("Submission rejected");
}

const Rejections = {
  GAMEMODE:     1,
  SONGCOUNT:    2,
  PLAYERS:      3,
  FINISHED:     4,
  RIGNOTFOUND:  5,
  DUPLICATE:    6,
  LIVES:        7
}

AMQ_addScriptData({
  name: "Velocity Button",
  author: "Yokipi",
  description: `
      <p>Adds a button to dump scoreboard to spreadsheet.</p>
      `
});
