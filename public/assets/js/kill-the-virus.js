const socket = io();

const startEl = document.querySelector('#start');
const lobbyEl = document.querySelector('#lobby-wrapper');
const winnerEl = document.querySelector('#victory');
const winnerMsgEl = document.querySelector('#winner-body');

const gameWrapperEl = document.querySelector('#game-wrapper');
const usernameForm = document.querySelector('#username-form');
const usernameFormInput = document.querySelector('#username');
const start_button = document.querySelector('#start-button');
const lobbyBtn = document.querySelector('#lobby-button');
const lobbyBtnAgain = document.querySelector('#again-lobby-button');
const backBtn = document.querySelector('#back-button');
const changeBtn = document.querySelector('#change-opponent');
const backToRoomBtn = document.querySelector('#back-to-room-button');
const waiting_label = document.querySelector('#waiting');
const opponent_disconnected_label = document.querySelector('#opponent_disconnected');
const games_now = document.querySelector('#games_now');
const recent_games = document.querySelector('#recent_games');
const fastest_time = document.querySelector('#fastest_time');

const play_again = document.querySelector('#play-again');
const winner_heading = document.querySelector('#winner-heading');

const virusImageEl = document.querySelector('#virus-image');

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

let username = null;
let startTime;
let elapsedTime = 0;
let timerInterval;
let timerInterval_opponent;
let totalmilliseconds = null;

// function to start timer
function startTimer(user_min, user_sec, user_ms) {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(function printTime() {
        elapsedTime = Date.now() - startTime;
        countTime(elapsedTime, user_min, user_sec, user_ms);
    }, 10);
}

// function to start timer for opponent. Changed both timers with extra arguments, because need to use function 'countTime' for both timers
function startTimer_opponent(user_min, user_sec, user_ms) {
    startTime = Date.now() - elapsedTime;
    timerInterval_opponent = setInterval(function printTime() {
        elapsedTime = Date.now() - startTime;
        countTime(elapsedTime, user_min, user_sec, user_ms);
    }, 10);
}

//  pause timer 
function pauseTimer() {
    clearInterval(timerInterval);
    countReaction();
}

// reset timer after every round
function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    you_minutes.innerHTML = "00";
    you_seconds.innerHTML = "00";
    you_milliseconds.innerHTML = "00";
    clearInterval(timerInterval_opponent);
    opponent_minutes.innerHTML = "00";
    opponent_seconds.innerHTML = "00";
    opponent_milliseconds.innerHTML = "00";
}

// convert reaction time to mmilliseconds
function countReaction() {
    let minutes = parseInt(you_minutes.innerHTML);
    let seconds = parseInt(you_seconds.innerHTML);
    let milliseconds = parseInt(you_milliseconds.innerHTML);
    totalmilliseconds = (minutes * 60000) + (seconds * 1000) + milliseconds;
}

// Convert time to a format of minutes, seconds, and milliseconds
function countTime(time, user_min, user_sec, user_ms) {

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

    user_min.innerHTML = formattedMM;
    user_sec.innerHTML = formattedSS;
    user_ms.innerHTML = formattedMS;

}

// listen for users names to add opponent name to game
socket.on('users:names', (user1, user2) => {
    if (user1 === username) {
        opponent_badge.innerHTML = user2;
    } else {
        opponent_badge.innerHTML = user1;
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
    // console.log(players);
});

// the first user listening when the opponent will be found
socket.on('user:ready', () => {
    startEl.classList.add('hide');
    gameWrapperEl.classList.remove('hide');
    start_button.classList.remove('hide');
    socket.emit('players:ready');
});

// listen if opponent disconnects; if it happens - showing the start screen again and start a new game in a new room
socket.on('user:disconnected', () => {
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

// listen for when the game has ended
socket.on('game:end', (winner, winnerPoints, loserOrTiePoints) => {
    // window.alert("The winner is: "+ result.winner); // this is temporary just to show winner
    play_again.classList.remove('hide');
    virusImageEl.classList.add('hide');
    winnerEl.classList.remove('hide');
    winner_heading.innerHTML = "Winner";
    winnerMsgEl.innerHTML =
        `
        <p>
            The winner is <b>${winner}</b> with <b>${winnerPoints}</b> points!
        </p>
    `
        // The winner is ${winner} with ${winnerPoints}-${loserOrTiePoints} points!  
        // If it's a tie
    if (winner == 'remis') {
        winnerMsgEl.innerHTML =
            `
        <p>
            ${loserOrTiePoints}-${loserOrTiePoints}, it's a tie!
        </p>
    `
    }
});

// Listen for when game is ready to start
socket.on('game:start', (randomDelay, randomPositionX, randomPositionY) => {

    // get random virus imaga in every game
    virusImageEl.setAttribute("src", `./assets/images/virus_${Math.floor(Math.random() * 13) + 1}.png`);

    let timerTimeout = setTimeout(() => {
        resetTimer();
    }, 1000);

    // Position virus image on grid

    virusImageEl.style.gridRow = randomPositionX;
    virusImageEl.style.gridColumn = randomPositionY;

    // Display virus after delay
    let virusTimeout = setTimeout(() => {
        virusImageEl.classList.remove('hide');
        startTimer(you_minutes, you_seconds, you_milliseconds);
        startTimer_opponent(opponent_minutes, opponent_seconds, opponent_milliseconds);
    }, randomDelay);

    // stop displaying virus after game ends
    socket.on('game:end', () => {
        clearTimeout(virusTimeout)
        clearInterval(timerTimeout);
    });

    backBtn.classList.remove('hide');
    backToRoomBtn.classList.add('hide');
    usernameFormInput.classList.remove('hide');
});

// listen when our opponent will send us his time amd then update his time on our side
socket.on('user:opponent_time', (paused_time_opponent) => {
    clearInterval(timerInterval_opponent);
    opponent_minutes.innerHTML = paused_time_opponent[0];
    opponent_seconds.innerHTML = paused_time_opponent[1];
    opponent_milliseconds.innerHTML = paused_time_opponent[2];
})

// create/update games i=and results in lobby in real time
socket.on('lobby:add_room_to_list', (rooms) => {
    games_now.innerHTML = '';
    for (let i = 0; i < rooms.length; i++) {
        const roomEl = document.createElement('tr');
        roomEl.setAttribute('id', `${rooms[i].id}`);
        roomEl.innerHTML = `<th scope="row">${i}</th>
        <td>
            <span>${rooms[i].users[0].username}</span> vs. <span>${rooms[i].users[1].username}</span>
        </td>
        <td id='points_${rooms[i].id}'>
            <span>${rooms[i].users[0].pointsNow}</span> - <span>${rooms[i].users[1].pointsNow}</span>
        </td>`;
        games_now.appendChild(roomEl);
    }
})

// update fastest time in real time
socket.on('lobby:show_highscore', (highscores) => {

    fastest_time.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        let score = highscores[i]
        if (!score) {
            return
        };
        const scoreEl = document.createElement('tr');
        scoreEl.innerHTML = `<tr>
        <th scope="row">${i+1}</th>
        <td>
            <span id="user1_${score.totalmilliseconds}">${score.username}</span> 
        </td>
        <td>
            <span id="points1_${score.totalmilliseconds}">${score.min}:${score.sec}:${score.ms}</span>
        </td>
    </tr>`;
        fastest_time.appendChild(scoreEl);
    }
});

// update recent games in lobby
socket.on('lobby:show_recent_games', (games) => {
    recent_games.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        let game = games[i]
        if (!game) {
            return
        };
        const roomEl = document.createElement('tr');
        roomEl.innerHTML = `<tr>
        <th scope="row">${i+1}</th>
        <td>
            <span id="user1_${game.id}">${game.user_1}</span> vs. <span id="user2_${game.id}">${game.user_2}</span>
        </td>
        <td>
            <span id="points1_${game.id}">${game.points_1}</span> - <span id="points2_${game.id}">${game.points_2}</span>
        </td>
    </tr>`;
        recent_games.appendChild(roomEl);
        if (game.winner === game.user_1) {
            document.querySelector(`#user1_${game.id}`).classList.add('bold');
            document.querySelector(`#points1_${game.id}`).classList.add('bold');
        } else if (game.winner === game.user_2) {
            document.querySelector(`#user2_${game.id}`).classList.add('bold');
            document.querySelector(`#points2_${game.id}`).classList.add('bold');
        }
    }
});

socket.on('users:ready_again', () => {
    winnerEl.classList.add('hide');
    your_score.innerHTML = 0;
    opponent_score.innerHTML = 0;
    waiting_label.classList.add('hide');
    socket.emit('players:ready');
});

socket.on('game:change_opponent', () => {
    play_again.classList.add('hide');
})

socket.on('users:want_play_again', (opponent_username) => {
    let msg = document.createElement('p');
    msg.innerHTML = `<b>${opponent_username} </b>wants to play with you one more time!`;
    winnerMsgEl.appendChild(msg);
})

// send reaction time to server
virusImageEl.addEventListener('click', e => {
    e.preventDefault();

    //hide image when clicked
    virusImageEl.classList.add('hide');

    pauseTimer();

    countReaction();

    if (!totalmilliseconds) {
        return;
    }

    let reactionTime = {
        username,
        totalmilliseconds,
        paused_time: [you_minutes.innerHTML, you_seconds.innerHTML, you_milliseconds.innerHTML]
    }

    // send reactionTime to server
    socket.emit('user:reaction', reactionTime);
});

// send information that opponet wants to play again
play_again.addEventListener('click', e => {
    socket.emit('user:play_again', username, (status) => {
        winnerMsgEl.innerHTML = "Waiting for opponent...";
        play_again.classList.add('hide');
        winner_heading.innerHTML = "Play again";
        if (!status.playAgainOneUser) {
            winnerEl.classList.add('hide');
            your_score.innerHTML = 0;
            opponent_score.innerHTML = 0;
            waiting_label.classList.add('hide');
        }
    });
});

// get username from form and show chat
usernameForm.addEventListener('submit', e => {
    e.preventDefault();

    username = usernameForm.username.value;
    username_badge.innerHTML = username;

    socket.emit('user:joined', username, (status) => {
        // we've received acknowledgement from the server
        // console.log("Server acknowledged that user joined", status);

        // hiding start_button 'Play' and showing text that user needs to wait for another user
        start_button.classList.add('hide');
        waiting_label.classList.remove('hide');
        usernameFormInput.classList.add('hide');
        opponent_disconnected_label.classList.add('hide');
        play_again.classList.remove('hide');

        // if it is the second user and we don't need to wait, we hiding the start screen
        if (!status.waiting_opponent) {
            startEl.classList.add('hide');
            gameWrapperEl.classList.remove('hide');
        }
        usernameForm.username.value = '';
    });
});

// Show lobby view when clicking on 'game lobby' button
lobbyBtn.addEventListener('click', () => {
    startEl.classList.add('hide');
    lobbyEl.classList.remove('hide');
});

// Show lobby view when clicking on 'game lobby' button from game (if user wants to stay in the same room)
lobbyBtnAgain.addEventListener('click', () => {
    startEl.classList.add('hide');
    lobbyEl.classList.remove('hide');
    backBtn.classList.add('hide');
    backToRoomBtn.classList.remove('hide');
    gameWrapperEl.classList.add('hide');
});

// Show start view when clicking on 'go back' button in lobby view
backBtn.addEventListener('click', () => {
    lobbyEl.classList.add('hide');
    startEl.classList.remove('hide');
});

backToRoomBtn.addEventListener('click', e => {
    lobbyEl.classList.add('hide');
    gameWrapperEl.classList.remove('hide');
});

changeBtn.addEventListener('click', () => {
    socket.emit('game:leave');
    startEl.classList.remove('hide');
    start_button.classList.remove('hide');
    waiting_label.classList.add('hide');
    winnerEl.classList.add('hide');
    gameWrapperEl.classList.add('hide');
    backBtn.classList.remove('hide');
    backToRoomBtn.classList.add('hide');
});