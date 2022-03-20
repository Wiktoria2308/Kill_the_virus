/**
 * Match Model
 */
const mongoose = require('mongoose');

// Declare Model Schema
const matchSchema = new mongoose.Schema({
    user_1: String,
    user_2: String,
    points_1: Number,
    points_2: Number,
    winner: String,
    id: String,
});

// Declare Model
const Match = mongoose.model('Match', matchSchema);

// Export Model
module.exports = Match;