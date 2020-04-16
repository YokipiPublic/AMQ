// ==UserScript==
// @name         AMQ FTF Remote Update
// @namespace    https://github.com/YokipiPublic/AMQ/
// @version      0.2
// @history      0.2 Game validation and message display
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
      let names = [], scores = [], rigs = [], numplayers = 0, i = 0;
      for (let entryID in quiz.scoreboard.playerEntries) {
        if (++numplayers > 2) break;
        let entry = quiz.scoreboard.playerEntries[entryID];
        names[i] = entry.$entry.find(".qpsPlayerName").text();
        scores[i] = entry.$score.text();
        rigs[i++] = entry.$entry.find(".qpsPlayerRig").text();
      }

      // Check number of songs and players, and rig exists
      var reject = 0;
      if (quiz.infoContainer.$totalSongCount.text() != "15") reject = 1;
      else if (numplayers != 2) reject = 2;
      else if (quiz.infoContainer.$currentSongCount.text() != "15" || !quiz.infoContainer.$nameHider.hasClass('hide')) reject = 3;
      else if (isNaN(parseInt(rigs[0])) || isNaN(parseInt(rigs[1]))) reject = 4;

      if (!reject) {
        // Create data object
        let data = {};
        data.P1 = names[0];
        data.S1 = scores[0];
        data.R1 = rigs[0];
        data.P2 = names[1];
        data.S2 = scores[1];
        data.R2 = rigs[1];

        // AJAX request
        submitRequest = $.ajax({
            url: "https://script.google.com/macros/s/AKfycbyQKN3iAJZMWL6gtn5_xPDs8ItQwHS_-A2tA6t2KkWwN6oZ8K8/exec",
            type: "post",
            data: data
        });

        // Callback handler that will be called on success
        submitRequest.done(function (response, textStatus, jqXHR) {
            if (response.result == "ERROR") {
              if (response.error.includes("repeated entry")) {
                displayMessage("Submission rejected:\nDuplicate submission");
                console.log("Duplicate submission");
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
        let rejectiontype = "Unknown";
        switch (reject) {
          case 1: rejectiontype = "Unexpected number of songs"; break;
          case 2: rejectiontype = "Unexpected number of players"; break;
          case 3: rejectiontype = "Game not yet finished"; break;
          case 4: rejectiontype = "Rig not found, please make sure the rig tracker is running"; break;
        }
        displayMessage("Submission rejected:\n" + rejectiontype);
        console.log("Submission rejected");
      }
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
