// ==UserScript==
// @name         AMQ FTF Remote Update
// @namespace    https://github.com/YokipiPublic/AMQ/
// @version      0.3.1
// @history      0.3 Support for AMQrews
// @history      0.2 Game validation and message display
// @description  Adds a button to update spreadsheet with current score/rig
// @author       Yokipi
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==

let remoteSubmitButton;
let submitRequest;

function addButton() {
  remoteSubmitButton = $(`<div id="qpSongListButton" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-wifi qpMenuItem"></i></div>`)
    .click(function () {

      // Abort any pending request
      if (submitRequest) {
        console.log("Aborting previous submission");
        submitRequest.abort();
      }

      // Get name, score, and rig
      let names = [], scores = [], rigs = [], guesses = [], numplayers = 0, i = 0;
      for (let entryID in quiz.scoreboard.playerEntries) {
        if (++numplayers > 2) break;
        let entry = quiz.scoreboard.playerEntries[entryID];
        names[i] = entry.$entry.find(".qpsPlayerName").text();
        scores[i] = entry.$score.text();
        rigs[i] = entry.$entry.find(".qpsPlayerRig").text();
        guesses[i++] = entry.$guessCount.text();
      }

      // Validate number of players and rig tracker
      let reject = 0;
      if (numplayers != 2) reject = Rejections.PLAYERS;
      else if (isNaN(parseInt(rigs[0])) || isNaN(parseInt(rigs[1]))) reject = Rejections.RIGNOTFOUND;

      // Create data object
      let data = {};
      data.P1 = names[0];
      data.R1 = rigs[0];
      data.P2 = names[1];
      data.R2 = rigs[1];

      // Check game mode, assign proper URL, validate additional settings, and add relevant data
      let gamemode = hostModal.getSettings().gameMode;
      let url;

      // If LMS, Crews
      if (gamemode == "Last Man Standing") {
        url = "https://script.google.com/macros/s/AKfycbyjVig9DhOBRixGXW4kVUQeN_0mXfFWCkxHcIGL2G_n1qqr-x8/exec";

        // Data
        // Score and Lives
        data.S1 = guesses[0];
        data.L1 = scores[0];
        data.S2 = guesses[1];
        data.L2 = scores[1];
        // Number of Songs
        data.NS = parseInt(quiz.infoContainer.$currentSongCount.text(), 10);
        if (!quiz.infoContainer.$nameHider.hasClass('hide')) data.NS--;
        // Song Types
        let songtypes = hostModal.getSettings().songType;
        let songtypesarray = [];
        if (songtypes.advancedOn) {
          if (songtypes.advancedValue.random > 0) {
            songtypesarray.push("OP");
            songtypesarray.push("ED");
            songtypesarray.push("IN");
          } else {
            if (songtypes.advancedValue.openings > 0) songtypesarray.push("OP");
            if (songtypes.advancedValue.endings > 0) songtypesarray.push("ED");
            if (songtypes.advancedValue.inserts > 0) songtypesarray.push("IN");
          }
        } else {
          if (songtypes.standardValue.openings) songtypesarray.push("OP");
          if (songtypes.standardValue.endings) songtypesarray.push("ED");
          if (songtypes.standardValue.inserts) songtypesarray.push("IN");
        }
        data.ST = songtypesarray.join("/");
        // Song Difficulty
        let songdifficulty = hostModal.getSettings().songDifficulity; // [SIC]
        let lowdifficulty = 100;
        let highdifficulty = 0;
        if (songdifficulty.advancedOn) {
          lowdifficulty = songdifficulty.advancedValue[0];
          highdifficulty = songdifficulty.advancedValue[1];
        } else {
          // Please don't play Easy/Hard
          if (songdifficulty.standardValue.easy) {
            lowdifficulty = Math.min(lowdifficulty, 60)
            highdifficulty = Math.max(highdifficulty, 100)
          }
          if (songdifficulty.standardValue.medium) {
            lowdifficulty = Math.min(lowdifficulty, 20)
            highdifficulty = Math.max(highdifficulty, 60)
          }
          if (songdifficulty.standardValue.hard) {
            lowdifficulty = Math.min(lowdifficulty, 0)
            highdifficulty = Math.max(highdifficulty, 20)
          }
        }
        data.SD = lowdifficulty + "-" + highdifficulty;
        // Guess Time
        let guesstime = hostModal.getSettings().guessTime;
        if (guesstime.randomOn) {
          data.GT = guesstime.randomValue[0] + "-" + guesstime.randomValue[1];
        } else {
          data.GT = guesstime.standardValue;
        }
        // Only Watched / Random
        let songselection = hostModal.getSettings().songSelection;
        let songselectionrandom = false;
        if (songselection.advancedOn) {
          if (songselection.advancedValue.random > 0) songselectionrandom = true;
        } else {
          if (songselection.standardValue != 3) songselectionrandom = true;
        }
        data.LR = songselectionrandom ? "Random" : "Only Watched";
        // Tags
        let tags = hostModal.getSettings().tags;
        if (typeof tags[0] !== 'undefined') {
          let tagprefix = "";
          if (tags[0].state == 1) tagprefix = "+";
          else if (tags[0].state == 2) tagprefix = "-";
          else if (tags[0].state == 3) tagprefix = "~";
          data.EX = tagprefix + idTranslator.tagNames[tags[0].id];
        } else {
          data.EX = "";
        }

        // Validation
        if (hostModal.getSettings().lives != 5) reject = Rejections.LIVES;

      // If Standard, League
      } else if (gamemode == "Standard") {
        url = "https://script.google.com/macros/s/AKfycbyslMGBlfqAwKXtcCiKg2Y0GelNjPQkqkS3oFbA/exec";

        // Data
        // Score
        data.S1 = scores[0];
        data.S2 = scores[1];

        // Validation
        if (quiz.infoContainer.$totalSongCount.text() != "15") reject = Rejections.SONGCOUNT;
        else if (quiz.infoContainer.$currentSongCount.text() != "15" || !quiz.infoContainer.$nameHider.hasClass('hide'))
          reject = Rejections.FINISHED;

      // Otherwise, no idea
      } else {
        reject = Rejections.GAMEMODE;
      }

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
  $("#qpOptionContainer > div").append(remoteSubmitButton);
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
  name: "Remote Update",
  author: "Yokipi",
  description: `
      <p>Adds a button to submit current score and rig to spreadsheet when clicked. Supports FTF League and FTF Crews. Submission will be rejected if game settings are not correct (e.g. more than two players).</p>
      `
});
