/**
 * Socket Controller
 */

const debug = require('debug')('kill-the-virus:socket_controller');

let io = null; // socket.io server instance

// list of socket-ids and their username
const users = {};
const rooms = [];

// creating a temporary storage for room
let room = {
    id: null,
    users: {},
    waiting: true,
}

const two_players = [];

const handleReactionTime = function(data) {

    if(two_players.length === 0) {
        data.score = 0;
        two_players.push(data);
    }
    if(two_players.length === 1) {
        if(two_players[0].username !== data.username){
            data.score = 0;
            two_players.push(data);
        }
    }
   
    if(two_players.length === 2) {
        if(two_players[0].totalmilliseconds < two_players[1].totalmilliseconds){
            two_players[0].score++;
            // io.in(this.id).emit('users:score', two_players);  ???
        }
        else {
            two_players[1].score++;
            // io.in(this.id).emit('users:score', two_players);  ???
        }
    }
    console.log('array two players', two_players);
    

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


    socket.on('user:reaction', handleReactionTime);


    // handle user joined
    socket.on('user:joined', function(username, callback) {

        // if there is no room creating a new room with id equal to the first users id
        if (!room.id) {
            room.id = this.id;
        } else {
            room.waiting = false;
        }
        //join room 
        this.join(room.id);

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
            this.emit('user:room', room.id);
            // clear room variable
            
            room = {
                id: null,
                users: {},
                waiting: true
            };
        }
    });

}