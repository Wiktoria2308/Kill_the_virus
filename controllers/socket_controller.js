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


const handleReactionTime = function(data) {

    // find the room that this socket is part of
    const room = rooms.find(chatroom => chatroom.users.hasOwnProperty(this.id));

    // sending the time when a user clicked on virus to his opponent
    this.broadcast.to(room.id).emit('user:opponent_time', data.paused_time);

    if (room.player_1 === undefined) {
        data.points = 0;
        room.player_1 = data;
    }
    if (room.player_1 && room.player_2 === undefined && room.player_1.username !== data.username) {
        data.points = 0;
        room.player_2 = data;
    }

    let players = [];
    let player1 = {};
    let player2 = {};
    if (room.player_1 !== undefined && room.player_2 !== undefined) {
        // console.log('room', room);  // it works yuupppi!!!
        if (room.player_1.totalmilliseconds < room.player_2.totalmilliseconds) {
            room.player_1.points++;
            player1.username = room.player_1.username;
            player1.points = room.player_1.points;
            players.push(player1);
            player1 = {};
            player2.username = room.player_2.username;
            player2.points = room.player_2.points;
            players.push(player2);
            player2 = {};
            // send score to both users
            io.in(room.id).emit('users:score', players);
            console.log('players', players);
            players = [];
            console.log('room, player 1 wins', room); // it works yuupppi!!!
        } else if (room.player_1.totalmilliseconds > room.player_2.totalmilliseconds) {
            room.player_2.points++;
            player1.username = room.player_1.username;
            player1.points = room.player_1.points;
            players.push(player1);
            player1 = {};
            player2.username = room.player_2.username;
            player2.points = room.player_2.points;
            players.push(player2);
            player2 = {};
            // send score to both users
            io.in(room.id).emit('users:score', players);
            console.log('players', players);
            players = [];
            console.log('room, player 2 wins', room); // it works yuupppi!!!
        }
    }
}


module.exports = function(socket, _io) {
    io = _io; // it must be to be possible to emit

    // debug('a new client has connected', socket.id);

    // handle user disconnect
    socket.on('disconnect', function() {
        // debug(`Client ${socket.id} disconnected :(`);

        // find the room that this socket is part of
        const room = rooms.find(room => room.users.hasOwnProperty(this.id));

        // if socket was not in a room, don't broadcast disconnect
        if (!room) {
            return;
        }
        debug('room id', room.id)
            // let everyone in the room know that this user has disconnected
        this.broadcast.to(room.id).emit('user:disconnected');

        // remove a room because we need to start a new game
        rooms.splice(rooms.indexOf(room), 1);
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
                users: {}
            };
            // push a new room to all rooms array
            rooms.push(room);
        } else {
            waiting_opponent = false;
        }

        // looking for a room with a name from temporary variabel in the rooms array
        const room = rooms.find(room => room.id === roomName);

        if (!room) {
            console.log('There is no such room');
            return;
        }
        debug('roomid', room.id)
            // join user to this room
        this.join(room.id);

        // associate socket id with username and store it in a room oject in the rooms array
        room.users[this.id] = username;

        debug(`User ${username} with socket id ${socket.id} joined`);

        // confirm join
        callback({
            success: true,
            // users: room.users,
            waiting_opponent
        });

        // if we don't need to wait an opponent anymore:
        if (!waiting_opponent) {
            console.log(room);
            // emit that a second user is ready to the first user
            this.broadcast.to(room.id).emit('user:ready');
            // discard the temporary variables
            waiting_opponent = true;
            roomName = null;
            // send users names to clients to show opponent user name 
            io.in(room.id).emit('users:names', room.users);
        };
    });

    socket.on('players:ready', function() {
        // Find room
        const room = rooms.find(id => id.users[this.id]);

        // Emit to specific room
        io.to(room.id).emit('game:start', getRandomDelay(), getRandomGridPosition(), getRandomGridPosition());
    });

}