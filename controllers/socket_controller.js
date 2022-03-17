/**
 * Socket Controller
 */

const debug = require('debug')('kill-the-virus:socket_controller');

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

        // let everyone connected know that user has disconnected
        this.broadcast.emit('user:disconnected', users[socket.id]);

        // remove user from list of connected users
        delete users[socket.id];
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