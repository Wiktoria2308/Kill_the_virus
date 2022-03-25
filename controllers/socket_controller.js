/**
 * Socket Controller
 */

const debug = require('debug')('kill-the-virus:socket_controller');
const models = require('../models');

let io = null; // socket.io server instance
// list of socket-ids and their username
const rooms = [];

// creating a temporary variabel with a name for room
let roomName = null;

// a 'toggler' for a status of a waiting opponent 
let waiting_opponent = true;

let play_again = null;
let playAgainOneUser = true;

let recent_games = [];
let highscores = [];

/** 
 * Calculate a player's average reaction time (in milliseconds) per game
 * 
 * @param {array} numArray Each element represents a player's reaction time in milliseconds eg. [4322, 1326, 6534, ...]
 * @param {number} gameRounds Number of rounds played in one game
 * @returns Average reactiontime per game
 */
const calcAverage = (numArray, gameRounds) => {
    const rounds = gameRounds;
    const sum = numArray.reduce((x, y) => {
        return x + y;
    }, 0);
    return (sum / rounds);
}

/**
 * Grid arena is set to be 5 x 5 items.
 * Function will be called twice to get x/y position of virus image.
 * 
 * @returns Random number between 1 and 5
 */
const getRandomGridPosition = () => {
    return Math.floor(Math.random() * 5) + 1;
}

/**
 * Virus image is set to appear anytime between 1 and 5 seconds.
 * 
 * @returns Random number between 1000 and 5000 (1 second = 1000 milliseconds)
 */
const getRandomDelay = () => {
    return Math.floor(Math.random() * (5000 - 1000)) + 1000;
}

const getGames = async() => {
    recent_games = await models.Match.find()
        .sort({ id: 'desc' })
        .limit(10);
}
getGames();

const getHighscores = async() => {
    highscores = await models.Highscore.find()
        .sort({ totalmilliseconds: 'desc' });
}
getHighscores();

/**
 * zeropad function that puts 0 in front of num if it's less than 10
 * 
 * @param {Number} num 
 * @returns 
 */
const zeropad = num => {
    if (num < 10) {
        return '0' + num;
    } else {
        return num;
    }
}

const handleReactionTime = async function(data) {

    // find the room that this socket is part of
    const room = rooms.find(room => room.users.find(user => user.id === this.id));

    // sending the time when a user clicked on virus to his opponent
    this.broadcast.to(room.id).emit('user:opponent_time', data.paused_time);

    //find user and add data to user
    const user = room.users.find(user => user.id === this.id);
    let total = data.totalmilliseconds;
    user.totalmillisecondsNow = data.totalmilliseconds;
    user.totalmilliseconds.push(total);

    // compare users time and send result
    if (room.users[0].totalmillisecondsNow !== 0 && room.users[1].totalmillisecondsNow !== 0 && room.rounds !== 10) {
        // if (room.users[0].totalmillisecondsNow !== 0 && room.users[1].totalmillisecondsNow !== 0 && room.rounds !== 2) {

        room.rounds++;
        if (room.users[0].totalmillisecondsNow < room.users[1].totalmillisecondsNow) {
            room.users[0].pointsNow++;
            players = [{ username: room.users[0].username, points: room.users[0].pointsNow }, { username: room.users[1].username, points: room.users[1].pointsNow }];
            io.in(room.id).emit('users:score', players);
            room.users[0].totalmillisecondsNow = 0;
            room.users[1].totalmillisecondsNow = 0;
            // Emit to specific room
            io.to(room.id).emit('game:start', getRandomDelay(), getRandomGridPosition(), getRandomGridPosition());
            // console.log('rounds', room.rounds);
        } else if (room.users[0].totalmillisecondsNow > room.users[1].totalmillisecondsNow) {
            room.users[1].pointsNow++;
            players = [{ username: room.users[0].username, points: room.users[0].pointsNow }, { username: room.users[1].username, points: room.users[1].pointsNow }];
            io.in(room.id).emit('users:score', players);
            room.users[0].totalmillisecondsNow = 0;
            room.users[1].totalmillisecondsNow = 0;
            // Emit to specific room
            io.to(room.id).emit('game:start', getRandomDelay(), getRandomGridPosition(), getRandomGridPosition());
            // console.log('rounds', room.rounds);
        } else if (room.users[0].totalmillisecondsNow === room.users[1].totalmillisecondsNow) {
            room.users[1].pointsNow++;
            room.users[0].pointsNow++;
            players = [{ username: room.users[0].username, points: room.users[0].pointsNow }, { username: room.users[1].username, points: room.users[1].pointsNow }];
            io.in(room.id).emit('users:score', players);
            room.users[0].totalmillisecondsNow = 0;
            room.users[1].totalmillisecondsNow = 0;
            // Emit to specific room
            io.to(room.id).emit('game:start', getRandomDelay(), getRandomGridPosition(), getRandomGridPosition());
            // console.log('rounds', room.rounds);
        }
    }
    if (room.rounds === 10) {
        // if (room.rounds === 2) {
        let gameResultat = {};
        gameResultat[room.users[0].username] = room.users[0].pointsNow;
        gameResultat[room.users[1].username] = room.users[1].pointsNow;
        if (room.users[0].pointsNow > room.users[1].pointsNow) {
            gameResultat.winner = room.users[0].username;
            gameResultat.loser = room.users[1].username;
            room.score.push(gameResultat);
        }
        if (room.users[0].pointsNow < room.users[1].pointsNow) {
            gameResultat.winner = room.users[1].username;
            gameResultat.loser = room.users[0].username;
            room.score.push(gameResultat);
        }
        if (room.users[0].pointsNow === room.users[1].pointsNow) {
            gameResultat.winner = 'remis';
            gameResultat.loser = room.users[0].username;
            room.score.push(gameResultat);
        }
        // console.log(room);
        let data = {
            winnerPoints: gameResultat[gameResultat.winner],
            loserOrTiePoints: gameResultat[gameResultat.loser]
        }

        // update recent games in lobby
        let game = {
                user_1: room.users[0].username,
                user_2: room.users[1].username,
                points_1: room.users[0].pointsNow,
                points_2: room.users[1].pointsNow,
                winner: gameResultat.winner,
                id: `${Date.now()}`
            }
            // save match in database
        try {
            const match = new models.Match({
                ...game,
            });
            await match.save();

            debug("Successfully saved match in the database.", game);
        } catch (e) {
            debug("Could not save match in the database.", game);
            debug(e)
                // this.emit('chat:notice', { message: "Could not save your message in the database." });
        }

        recent_games = await models.Match.find()
            .sort({ id: 'desc' })
            .limit(10);

        io.emit('lobby:show_recent_games', recent_games);

        io.to(room.id).emit('game:end', gameResultat.winner, data.winnerPoints, data.loserOrTiePoints);

        // Get players' usernames
        const playerOne = room.users[0].username;
        const playerTwo = room.users[1].username;

        // Get players' reaction times 
        const playerOneAverages = room.users[0].totalmilliseconds;
        const playerTwoAverages = room.users[1].totalmilliseconds;

        // Calculate each player's average reaction time
        const averageOne = calcAverage(playerOneAverages, room.rounds);
        const averageTwo = calcAverage(playerTwoAverages, room.rounds);

        // Find player with lowest reaction time
        let averageGameBest = Math.min(averageOne, averageTwo);

        // Set 'bestPlayer' to the player with the lowest reaction time
        let bestPlayer = averageGameBest == averageOne ? playerOne : playerTwo;

        // Create highscore object using retrieved data
        // Format milliseconds to minutes, seconds and centiseconds
        // Use zeropad so that eg. 0 min, 1 sec and 5 ms are stored as 00 min 01 sec and 05 ms
        const highscore = {
            min: zeropad(Math.trunc(averageGameBest / 1000 / 60)),
            sec: zeropad(Math.trunc(averageGameBest / 1000)),
            ms: zeropad(Math.trunc(averageGameBest % 1000 / 10)),
            totalmilliseconds: averageGameBest,
            username: bestPlayer
        }

        // save highscore in database
        try {
            const highscore_db = new models.Highscore({
                ...highscore,
            });
            await highscore_db.save();

            debug("Successfully saved highscore in the database.", highscore);
        } catch (e) {
            debug("Could not save highscore in the database.", highscore);
            debug(e)
        }

        // Get updated highscores but limit result to top 10
        highscores = await models.Highscore
            .find()
            .sort({ totalmilliseconds: 'asc' })
            .limit(10);

        console.log("highscores", highscores)

        io.emit('lobby:show_highscore', highscores);

        room.rounds = 0;
    }

    io.emit('lobby:add_room_to_list', rooms);

}

module.exports = function(socket, _io) {
    io = _io; // it must be to be possible to emit

    io.emit('lobby:show_highscore', highscores);
    io.emit('lobby:show_recent_games', recent_games);

    // handle user disconnect
    socket.on('disconnect', function() {
        // debug(`Client ${socket.id} disconnected :(`);

        // find the room that this socket is part of
        const room = rooms.find(room => room.users.find(user => user.id === this.id));

        // if socket was not in a room, don't broadcast disconnect
        if (!room) {
            return;
        }

        // let everyone in the room know that this user has disconnected
        this.broadcast.to(room.id).emit('user:disconnected');
        // remove a room because we need to start a new game
        rooms.splice(rooms.indexOf(room), 1);

        io.emit('lobby:add_room_to_list', rooms);
    });

    // listen for user reaction time 
    socket.on('user:reaction', handleReactionTime);

    socket.on('user:play_again', function(username, callback) {
        const room = rooms.find(room => room.users.find(user => user.id === this.id));
        // this.broadcast.to(room.id).emit('users:play_again');
        // const user = room.users.find(user => user.id === this.id);
        if (!play_again) {
            play_again = username;
        } else {
            playAgainOneUser = false;
        }
        callback({
            success: true,
            playAgainOneUser
        });

        if (!playAgainOneUser) {
            playAgainOneUser = true;
            play_again = null;
            this.broadcast.to(room.id).emit('users:ready_again');
        }

        room.users[0].pointsNow = 0;
        room.users[1].pointsNow = 0;

    });

    // handle user joined
    socket.on('user:joined', function(username, callback) {

        // if there is no room creating a new room with id equal to the first users id
        if (!roomName) {
            roomName = 'room_' + this.id;
            let room = {
                id: roomName,
                users: [],
                rounds: 0,
                score: [],
            };
            // push a new room to all rooms array
            rooms.push(room);
        } else {
            waiting_opponent = false;
        }

        // looking for a room with a name from temporary variabel in the rooms array
        const room = rooms.find(room => room.id === roomName);

        if (!room) {
            debug('There is no such room');
            return;
        }

        // join user to this room
        this.join(room.id);

        // associate socket id with username and store it in a room oject in the rooms array
        let user = {
            id: this.id,
            username: username,
            totalmillisecondsNow: 0,
            totalmilliseconds: [],
            pointsNow: 0,
        }

        room.users.push(user);

        // confirm join
        callback({
            success: true,
            waiting_opponent
        });

        // if we don't need to wait an opponent anymore:
        if (!waiting_opponent) {
            // emit that a second user is ready to the first user
            this.broadcast.to(room.id).emit('user:ready');
            // discard the temporary variables
            waiting_opponent = true;
            roomName = null;
            // send users names to clients to show opponent user name 
            io.in(room.id).emit('users:names', room.users[0].username, room.users[1].username);
        };
    });

    socket.on('players:ready', function() {
        // Find room
        const room = rooms.find(room => room.users.find(user => user.id === this.id));

        io.emit('lobby:add_room_to_list', rooms);
        // Emit to specific room
        io.to(room.id).emit('game:start', getRandomDelay(), getRandomGridPosition(), getRandomGridPosition());
    });

    socket.on('game:leave', () => {
        const room = rooms.find(room => room.users.find(user => user.id === socket.id));
        if (!room) {
            return;
        }
        io.in(room.id).emit('game:change_opponent');
        rooms.splice(rooms.indexOf(room), 1);
        io.emit('lobby:add_room_to_list', rooms);
    })
}