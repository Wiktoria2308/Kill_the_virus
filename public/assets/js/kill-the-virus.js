const socket = io();

const startEl = document.querySelector('#start');
const gameWrapperEl = document.querySelector('#game-wrapper');
const usernameForm = document.querySelector('#username-form');
const start_button = document.querySelector('.btn-primary');
const waiting_label = document.querySelector('#waiting');
const opponent_disconnected_label = document.querySelector('#opponent_disconnected');

const virusImageEl = document.querySelector('#virus-image');

let username = null;
let room = null;

let your_score = document.querySelector('#you-score');
let opponent_score = document.querySelector('#opponent-score');
let username_badge = document.querySelector('#username-badge');
let opponent_badge = document.querySelector('#opponent-badge');
let you_minutes = document.querySelector('#you-minutes');
let you_seconds = document.querySelector('#you-seconds');
let you_milliseconds = document.querySelector('#you-milliseconds');
let opponent_minutes = document.querySelector('#opponent-minutes');
let opponent_seconds = document.querySelector('#opponent-seconds');
let opponent_milliseconds = document.querySelector('#opponent-milliseconds');
let virusImage = document.querySelector('#virus-image');

let startTime;
let elapsedTime = 0;
let timerInterval;

// function to start timer
function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(function printTime() {
        elapsedTime = Date.now() - startTime;
        countTime(elapsedTime);
    }, 10);
}

//  pause timer 
//  todo: take paused time as user reaction time
function pauseTimer() {
    clearInterval(timerInterval);
    countReaction();
}

// todo:  reset timer after every round
function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    you_minutes.innerHTML = "00";
    you_seconds.innerHTML = "00";
    you_milliseconds.innerHTML = "00";
}

let totalmilliseconds = null;
let paused_time = null;

function countReaction() {
    let minutes = parseInt(you_minutes.innerHTML);
    let seconds = parseInt(you_seconds.innerHTML);
    let milliseconds = parseInt(you_milliseconds.innerHTML);
    totalmilliseconds = (minutes * 60000) + (seconds * 1000) + milliseconds;
    paused_time = you_minutes.innerHTML + ':' + you_seconds.innerHTML + ':' + you_milliseconds.innerHTML;
}

// Convert time to a format of minutes, seconds, and milliseconds
function countTime(time) {

    let diffInHrs = time / 3600000;
    let hh = Math.floor(diffInHrs);

    let diffInMin = (diffInHrs - hh) * 60;
    let mm = Math.floor(diffInMin);

    let diffInSec = (diffInMin - mm) * 60;
    let ss = Math.floor(diffInSec);

    let diffInMs = (diffInSec - ss) * 100;
    let ms = Math.floor(diffInMs);

    let formattedMM = mm.toString().padStart(2, "0");
    let formattedSS = ss.toString().padStart(2, "0");
    let formattedMS = ms.toString().padStart(2, "0");

    you_minutes.innerHTML = formattedMM;
    you_seconds.innerHTML = formattedSS;
    you_milliseconds.innerHTML = formattedMS;

    opponent_minutes.innerHTML = formattedMM;
    opponent_seconds.innerHTML = formattedSS;
    opponent_milliseconds.innerHTML = formattedMS;
}
// listen for users names to add opponent name to game
socket.on('users:names', (users) => {
    for (const key in users) {
        if (users[key] !== username) {
            opponent_badge.innerHTML = users[key];
        }
    }
});


// listen for users score and show them in game
socket.on('users:score', (players) => {
    if (players[0].username === username) {
        your_score.innerHTML = players[0].points;
        opponent_score.innerHTML = players[1].points;
    } else if (players[1].username === username) {
        opponent_score.innerHTML = players[0].points;
        your_score.innerHTML = players[1].points;
    }
    console.log(players);
});

// get username from form and show chat
usernameForm.addEventListener('submit', e => {
    e.preventDefault();

    username = usernameForm.username.value;
    username_badge.innerHTML = username;

    socket.emit('user:joined', username, (status) => {
        // we've received acknowledgement from the server
        console.log("Server acknowledged that user joined", status);

        // hiding start_button 'Play' and showing text that user needs to wait for another user
        start_button.classList.add('hide');
        waiting_label.classList.remove('hide');
        opponent_disconnected_label.classList.add('hide');

        // if it is the second user and we don't need to wait, we hiding the start screen
        if (!status.waiting_opponent) {
            startEl.classList.add('hide');
            gameWrapperEl.classList.remove('hide');
        }
        usernameForm.username.value = '';
    });
});
// the first user listening when the opponent will be found
socket.on('user:ready', () => {
    console.log('user ready!!!');
    startEl.classList.add('hide');
    gameWrapperEl.classList.remove('hide');
    start_button.classList.remove('hide');
    socket.emit('players:ready');
});

// listen if opponent disconnects; if it happens - showing the start screen again and start a new game in a new room
socket.on('user:disconnected', () => {
    console.log("Opponent disconnected!")
    gameWrapperEl.classList.add('hide');
    startEl.classList.remove('hide');
    start_button.classList.remove('hide');
    waiting_label.classList.add('hide')
    opponent_disconnected_label.classList.remove('hide');
});

// listen for when we're disconnected
socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
        // reconnect to the server
        socket.connect();
    }
});

// Listen for when game is ready to start
socket.on('game:start', (randomDelay, randomPositionX, randomPositionY) => {

    // Position virus image on grid
    virusImageEl.style.gridRow = randomPositionX;
    virusImageEl.style.gridColumn = randomPositionY;

    // Display virus after delay
    setTimeout(() => {
        virusImageEl.classList.remove('hide');
    }, randomDelay)
    startTimer();
});

socket.on('user:opponent_time', (paused_time_opponent) => {
    console.log('opponent paused at ', paused_time_opponent)
})

// send reaction time to server
virusImage.addEventListener('click', e => {
    e.preventDefault();

    pauseTimer();

    countReaction();

    if (!totalmilliseconds) {
        return;
    }

    let reactionTime = {
        username,
        totalmilliseconds,
        paused_time
    }

    // send reactionTime to server
    socket.emit('user:reaction', reactionTime);

    // clear timer
    // resetTimer();
}, { once: true }); // user can click only once on the virus