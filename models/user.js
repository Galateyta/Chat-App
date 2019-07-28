const mongoose = require('../database/mongodb.js');

const UserSchema = new mongoose.Schema({
    uid: String,
    
    name: {
        type: String,
        trim: true,
        minlength: [2, 'Too short'],
        required: 'name can\'t be empty'
    },

    friends: [String],

    chats: [
        {
        friendId: String,
        messages: [{
            author: String,
            message: String,
            receiver: String

        }]
    }],

    publicChat: [{
        messages: [{
            author: String,
            message: String,
        }]
    }]

});

const User = mongoose.model('User', UserSchema);
module.exports = User;