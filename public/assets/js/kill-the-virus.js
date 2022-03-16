const socket = io();

const startEl = document.querySelector('#start');
const gameWrapperEl = document.querySelector('#game-wrapper');
const usernameForm = document.querySelector('#username-form');
const button = document.querySelector('.btn-primary');
const waiting = document.querySelector('#waiting')

let username = null;


// get username from form and show chat
usernameForm.addEventListener('submit', e => {
    e.preventDefault();

    username = usernameForm.username.value;

    socket.emit('user:joined', username, (status) => {
        // we've received acknowledgement from the server
        console.log("Server acknowledged that user joined", status);

        // hiding button 'Play' and showing text that user needs to wait for another user
        button.classList.add('hide')
        waiting.classList.remove('hide')

        // if it is the second user we hiding the start screen
        if (!status.waiting) {
            startEl.classList.add('hide');
            gameWrapperEl.classList.remove('hide');

            // if it is the first user we 'listening' for the second user and only when we get the answer hiding start screen
        } else {
            socket.on('user:ready', () => {
                startEl.classList.add('hide');
                gameWrapperEl.classList.remove('hide');
            })
        }

    });

});