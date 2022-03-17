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

// who wins ?
const handleReactionTime = function(data) {

    // find the room that this socket is part of
	 const room = rooms.find(chatroom => chatroom.users.hasOwnProperty(this.id));
    
     // add user data to room
    if(room.player_1 === undefined) {
        data.score = 0;
        room.player_1 = data;
    }
    // add second user data to room , check if user is not already asigned
    if(room.player_1 && room.player_2 === undefined && room.player_1.username !== data.username){
        data.score = 0;
        room.player_2 = data;
    }
    

    // temporary storage for users data
    let players = [];
    let player1 = {};
    let player2 = {};

    // if two users clicked on virus then check which one was faster 
    if(room.player_1 !== undefined && room.player_2 !== undefined){
        console.log('room', room);  // it works yuupppi!!!
        if(room.player_1.totalmilliseconds < room.player_2.totalmilliseconds){
            room.player_1.score++;
            //  save users score information in array and send it to users
            player1.username = room.player_1.username;
            player1.score = room.player_1.score;
            players.push(player1);
            player1 = {};
            player2.username = room.player_2.username;
            player2.score = room.player_2.score;
            players.push(player2);
            player2 = {};
            // send score to both users
            io.in(room.id).emit('users:score', players);
            console.log('players', players);
            players = [];
        }
        else if(room.player_1.totalmilliseconds > room.player_2.totalmilliseconds) {
            room.player_2.score ++;
             //  save users score information in array and send it to users
            player1.username = room.player_1.username;
            player1.score = room.player_1.score;
            players.push(player1);
            player1 = {};
            player2.username = room.player_2.username;
            player2.score = room.player_2.score;
            players.push(player2);
            player2 = {};
            // send score to both users
            io.in(room.id).emit('users:score', players);
            console.log('players', players);
            players = [];
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