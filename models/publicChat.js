const mongoose = require('../database/mongodb.js');

const PublicMessagesSchema = new mongoose.Schema({
    author: String,
    message: String
});

const PublicMessages = mongoose.model('PublicMessage', PublicMessagesSchema);

module.exports = PublicMessages;