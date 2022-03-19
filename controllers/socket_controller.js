/**
 * Socket Controller
 */

const debug = require('debug')('kill-the-virus:socket_controller');

let io = null; // socket.io server instance

// Grid arena is set to be 5 x 5. This function returns a random number between 1 and 5.
// Function will be called twice to get x/y position.
const getRandomGridPosition = () => {
    return Math.floor(Math.random() * 5) + 1;
}

// Virus image is set to appear anytime between 1 and 5 seconds. This function returns a random number between 1000 and 5000 (1 second = 1000 milliseconds).
const getRandomDelay = () => {
    return Math.floor(Math.random() * (5000 - 1000)) + 1000;
}

// list of socket-ids and their username
const rooms = [];

// creating a temporary variabel with a name for room
let roomName = null;

// a 'toggler' for a status of a waiting opponent 
let waiting_opponent = true;

let highscore = 0;

const handleReactionTime = function(data) {

    // find the room that this socket is part of
    const room = rooms.find(room => room.users.find(user => user.id === this.id));
    // sending the time when a user clicked on virus to his opponent
    this.broadcast.to(room.id).emit('user:opponent_time', data.paused_time);

    //find user and add data to user
    const user = room.users.find(user => user.id === this.id);
    let total = data.totalmilliseconds;
    user.totalmillisecondsNow = data.totalmilliseconds;
    user.totalmilliseconds.push(total);
    // console.log('room before', user.totalmilliseconds)
    // compare users time and send result
    if (room.users[0].totalmillisecondsNow !== 0 && room.users[1].totalmillisecondsNow !== 0 && room.rounds !== 10) {
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
        }
    }
    if (room.rounds === 10) {
        let gameResultat = {};
        gameResultat[room.users[0].username] = room.users[0].pointsNow;
        gameResultat[room.users[1].username] = room.users[1].pointsNow;
        room.score.push(gameResultat);
        // console.log(room.score);
        if (room.users[0].pointsNow > room.users[1].pointsNow) {
            gameResultat.winner = room.users[0].username;
            gameResultat.loser = room.users[1].username;
        }
        if (room.users[0].pointsNow < room.users[1].pointsNow) {
            gameResultat.winner = room.users[1].username;
            gameResultat.loser = room.users[0].username;
        }
        if (room.users[0].pointsNow === room.users[1].pointsNow) {
            gameResultat.winner = 'remis';
            gameResultat.loser = room.users[0].username;
        }

        let data = {
            winnerPoints: gameResultat[gameResultat.winner],
            loserOrTiePoints: gameResultat[gameResultat.loser]
        }

        // io.to(room.id).emit('game:end', gameResultat);
        io.to(room.id).emit('game:end', gameResultat.winner, data.winnerPoints, data.loserOrTiePoints);
        room.users[0].pointsNow = 0;
        room.users[1].pointsNow = 0;
        // room.rounds = 0;
    }
    // console.log('room now', room.users)

    // get fastest time
    if (highscore === 0) {
        highscore = data.totalmilliseconds;
        io.emit('game:create_highscore_lobby', data.username, data.paused_time);
    } else if (data.totalmilliseconds < highscore) {
        highscore = data.totalmilliseconds;
        io.emit('game:create_highscore_lobby', data.username, data.paused_time);
    }
    io.emit('game:create_game_in_lobby', rooms);
}


module.exports = function(socket, _io) {
    io = _io; // it must be to be possible to emit

    // debug('a new client has connected', socket.id);

    // handle user disconnect
    socket.on('disconnect', function() {
        // debug(`Client ${socket.id} disconnected :(`);

        // find the room that this socket is part of
        const room = rooms.find(room => room.users.find(user => user.id === this.id));

        // if socket was not in a room, don't broadcast disconnect
        if (!room) {
            return;
        }
        // debug('room id', room.id)
        // let everyone in the room know that this user has disconnected
        this.broadcast.to(room.id).emit('user:disconnected');
        // remove a room because we need to start a new game
        rooms.splice(rooms.indexOf(room), 1);

        io.emit('game:create_game_in_lobby', rooms);
    });


    // listen for user reaction time 
    socket.on('user:reaction', handleReactionTime);


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
        // debug('roomid', room.id)
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

        // debug(`User ${username} with socket id ${socket.id} joined`);

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

        io.emit('game:create_game_in_lobby', rooms);
        // Emit to specific room
        io.to(room.id).emit('game:start', getRandomDelay(), getRandomGridPosition(), getRandomGridPosition());
    });

    // socket.on('game:round', function() {
    //     // Find room
    //     const room = rooms.find(room => room.users.find(user => user.id === this.id));

    //     /**
    //      * @todo Finish code when rounds and winner/loser data is known
    //      */

    //     // Test data
    //     let rounds = 10;
    //     let winner = 'Alice'
    //     let winnerPoints = 10
    //     let loserPoints = 3

    //     if (rounds === 10) {
    //         io.to(room.id).emit('game:victory', winner, winnerPoints, loserPoints);
    //     } else {
    //         // Game continues
    //     }
    // })
}