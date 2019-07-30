const PublicMessages = require('../models/publicChat.js');


async function addPublicChat(chat) {
    console.log('chat', chat)
   const newChat = new PublicMessages(chat);

    try {
        const chat = await newChat.save();
    } catch (err) {
        console.error('err', `res /users ${JSON.stringify(err)}`);
    }

}

async function getPublicChat() {
    try {
        const messages = await PublicMessages.find({});

        if (!messages) {
            console.error('err', "No record found");
            throw new Error();
        }

        return messages;
    } catch (err) {
        console.error('err', `res /users ${JSON.stringify(err)}`);
    }
}

module.exports.addPublicChat = addPublicChat;
module.exports.getPublicChat = getPublicChat;