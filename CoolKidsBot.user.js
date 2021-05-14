// ==UserScript==
// @name         AMQ CoolKids Bot
// @namespace    https://github.com/YokipiPublic/AMQ/
// @version      0.2
// @history      0.2 /setscore and /togglepenalty
// @history      0.1 Initial release
// @description  Calculates and keeps score for AMQ CoolKids
// @author       Yokipi
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==

let bot_active = 0;
let player_data = {};
let turn_order = [];
let turn = 0;
let block_penalty = 0;
let block_answer = '';

// Bind chat listeners
new Listener("Game Chat Message", (payload) => {
	processChatCommand(payload);
}).bindListener();
new Listener("game chat update", (payload) => {
	payload.messages.forEach(message => {
		processChatCommand(message);
	});
}).bindListener();

// Process chat commands
function processChatCommand(payload) {
	if (payload.sender !== selfName) return;
	if (payload.message === '/start') {
		bot_active = 1;
        player_data = {};
        turn_order = [];
        turn = 0;
        block_answer = '';
        for (let id in quiz.players) {
            let player = quiz.players[id];
            player_data[player.gamePlayerId] = {
                score: 0,
                guess: '',
                name: player._name
            };
            turn_order.push(player.gamePlayerId);
        }
        sendBotMessage(`The first blocker is ${player_data[turn_order[(turn)%turn_order.length]].name}.`);
	} else if (payload.message === '/stop') {
        bot_active = 0;
	} else if (payload.message === '/rules') {
        sendBotMessage('You get a point if you put a correct entry that\'s not the same as what the blocker entered. Blocker rotates every song.');
    } else if (payload.message.startsWith('/setscore ')) {
        let args = payload.message.split(' ');
        for (let id in player_data) {
            if (player_data[id].name === args[1]) {
                player_data[id].score = parseInt(args[2]);
                break;
            }
        }
    } else if (payload.message === '/togglepenalty') {
        block_penalty = ~block_penalty;
    }
}

// On guess reveal listener
new Listener("player answers", (result) => {
    if (!bot_active) return;
    // Store guesses and find blocking answer
    for (let answer of result.answers) {
        if (answer.gamePlayerId === turn_order[(turn)%turn_order.length]) {
            block_answer = answer.answer.toLowerCase();
        }
        player_data[answer.gamePlayerId].guess = answer.answer.toLowerCase();
    }

}).bindListener();

// On answer reveal listener
new Listener("answer results", (result) => {
    if (!bot_active) return;
    // Calculate new scores
    for (let player of result.players) {
        if (player.correct === true && player.gamePlayerId !== turn_order[(turn)%turn_order.length]) {
            if (player_data[player.gamePlayerId].guess !== block_answer) {
                player_data[player.gamePlayerId].score++;
            } else {
                player_data[player.gamePlayerId].score += block_penalty;
            }
        }
    }
    // Print scores
    let sort_list = [];
    for (let id in player_data) {
        sort_list.push([player_data[id].name, player_data[id].score]);
    }
    sort_list.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < sort_list.length; i+=2) {
        sendBotMessage(`${sort_list[i][0]} ${sort_list[i][1]}`
                       + (i+1 < sort_list.length ? ` // ${sort_list[i+1][0]} ${sort_list[i+1][1]}` : ''));
    }
    // Print next blocker
    sendBotMessage(`The next blocker is ${player_data[turn_order[(++turn)%turn_order.length]].name}.`);
}).bindListener();

// Send bot message
function sendBotMessage(message) {
    let oldMessage = gameChat.$chatInputField.val();
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
    gameChat.$chatInputField.val(oldMessage);
}


AMQ_addScriptData({
  name: "CoolKids Bot",
  author: "Yokipi",
  description: `
      <p>Calculates and keeps score for the CoolKids custom game mode.</p>
      `
});
