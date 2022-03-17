/**
 * Socket Controller
 */

const debug = require('debug')('kill-the-virus:socket_controller');

let io = null; // socket.io server instance
let roomId = null;
// list of socket-ids and their username
const users = {};
const rooms = [];

// creating a temporary storage for room
let room = {
    id: null,
    users: {},
    waiting: true,
}

let two_players = [];

const handleReactionTime = function(data) {

    // if two players array is empty add first player with his reaction time
    if(two_players.length === 0) {
        data.score = 0;
        two_players.push(data);
    }
    // if there is already one player in array check if this player are not already in array if not add him
    if(two_players.length === 1 && two_players.length !== 2) {
        if(two_players[0].username !== data.username){
            data.score = 0;
            two_players.push(data);
        }
    }

    // if there is two players in array check their reaction time and check which one won 
    if(two_players.length === 2) {
        if(two_players[0].totalmilliseconds < two_players[1].totalmilliseconds){
            two_players[0].score++;
            // send score to both users
            io.in(roomId).emit('users:score',two_players);
            // empty players array 
            two_players = [];
        }
        else if(two_players[1].totalmilliseconds < two_players[0].totalmilliseconds) {
            two_players[1].score++;
              // send score to both users
              io.in(roomId).emit('users:score',two_players);
              // empty players array 
              two_players = [];
        }
    }
    
}


module.exports = function(socket, _io) {
    io = _io; // it must be to be possible to emit

    // debug('a new client has connected', socket.id);

    // handle user disconnect
    socket.on('disconnect', function() {
        debug(`Client ${socket.id} disconnected :(`);

        // let everyone connected know that user has disconnected
        this.broadcast.emit('user:disconnected', users[socket.id]);

        // remove user from list of connected users
        delete users[socket.id];
    });


    // listen for user reaction time 
    socket.on('user:reaction', handleReactionTime);


    // handle user joined
    socket.on('user:joined', async function(username, callback) {

        // if there is no room creating a new room with id equal to the first users id
        if (!room.id) {
            room.id = this.id;
        } else {
            room.waiting = false;
        }
        //join room 
        this.join(room.id);
        // declare room id for players
        roomId = room.id;
        
        room.users[this.id] = username;

        debug(`User ${username} with socket id ${socket.id} joined`);

        callback({
            success: true,
            users: room.users,
            waiting: room.waiting
        });
       
        // confirm join
        if (room.waiting == false) {
            this.broadcast.to(room.id).emit('user:ready')
                // pushin room to all rooms array
            rooms.push(room);

            // send users names to clients to show opponent user name 
            io.in(room.id).emit('users:names', room.users);
            // clear room variable
            
            room = {
                id: null,
                users: {},
                waiting: true
            };
        }
    });

}