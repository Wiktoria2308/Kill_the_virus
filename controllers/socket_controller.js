/**
 * Socket Controller
 */

const debug = require('debug')('chat:socket_controller');

// list of socket-ids and their username
const users = {};

module.exports = function(socket) {
	debug('a new client has connected', socket.id);

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
		// associate socket id with username
		users[socket.id] = username;

		debug(`User ${username} with socket id ${socket.id} joined`);

		// let everyone know that someone has connected to the chat
		socket.broadcast.emit('user:connected', username);

		// confirm join
		callback({
			success: true,
		});
	});


}
