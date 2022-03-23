/**
 * Highscore Model
 */
const mongoose = require('mongoose');

// Declare Model Schema
const highscoreSchema = new mongoose.Schema({
    totalmilliseconds: Number,
    username: String
});

// Declare Model
const Highscore = mongoose.model('Highscore', highscoreSchema);

// Export Model
module.exports = Highscore;