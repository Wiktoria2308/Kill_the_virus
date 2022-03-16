/**
 * Socket Controller
 */

const debug = require('debug')('kill-the-virus:socket_controller');

// list of socket-ids and their username
const users = {};
const rooms = [];

// creating a temporary storage for room
let room = {
    id: null,
    users: {},
    waiting: true
}

module.exports = function(socket) {
    // debug('a new client has connected', socket.id);

    // handle user disconnect
    socket.on('disconnect', function() {
        debug(`Client ${socket.id} disconnected :(`);

        // find the room that this socket is part of
        const room = rooms.find(room => room.users.hasOwnProperty(this.id));

        // if socket was not in a room, don't broadcast disconnect
        if (!room) {
            return;
        }

        debug(rooms)
        debug(room.id)

        // let everyone in the room know that this user has disconnected
        this.broadcast.to(room.id).emit('user:disconnected');
        debug('1111')
        this.emit('user:disconnected')
        debug('222')
        socket.emit('user:disconnected')
        debug('33333')

        // remove user from list of connected users
        // delete users[socket.id];
    });

    // handle user joined
    socket.on('user:joined', function(username, callback) {

        // if there is no room creating a new room with id equal to the first users id
        if (!room.id) {
            room.id = this.id;
        } else {
            room.waiting = false;
        }

        room.users[this.id] = username;

        this.join(room.id);

        debug(`User ${username} with socket id ${socket.id} joined`);

        this.broadcast.to(room.id).emit('user:disconnected');
        this.emit('user:disconnected')
        socket.emit('user:disconnected')
        debug('message emitted');

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
            // clear room variable
            room = {
                id: null,
                users: {},
                waiting: true
            };
        }
    });
}