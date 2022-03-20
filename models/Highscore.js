/**
 * Highscore Model
 */
const mongoose = require('mongoose');

// Declare Model Schema
const highscoreSchema = new mongoose.Schema({
    highscore: [Number, Number, Number],
});

// Declare Model
const Highscore = mongoose.model('Highscore', highscoreSchema);

// Export Model
module.exports = Highscore;