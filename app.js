const express = require('express');
const app = express();
const fs = require('fs');
const userController = require('./controllers/user.js');
const publicChat = require('./controllers/publicChat.js');

const server = app.listen(4000);
const io = require('socket.io')(server);

var clients = {};
let uid;

console.log("server running 4000 port");
app.get('/', (req, res) => {
  fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      res.end(data);
    });
});

io.sockets.on('connection', function (socket) {
  //send and recive public message
  socket.on('public-message', function (publicData) {
    io.emit('public-message', publicData);
    const updateMess = {
      author: publicData.author,
      message: publicData.message
    }
    
    publicChat.addPublicChat(updateMess);
  });

  socket.on('private-chat', async function (data) {
    const user = await userController.getUsers({
      uid: data.username
    });

    for (const chat of user[0].chats) {
      if (chat.friendId == data.reciver) {
        io.sockets.connected[clients[data.username].socket].emit("getAllMessages", chat.messages);
      }
    }
  });

  socket.on('add-user', async (data) => {
    uid = data.username;
    const body = {
      uid: uid,
      name: data.username,
      friends: [],
      chats: []
    };

    const result = await userController.addUser(body);
    if (result) {
      uid = result;
    }

    clients[uid] = {
      "socket": socket.id
    };
    try {
      const messages = await publicChat.getPublicChat();
      io.sockets.connected[clients[uid].socket].emit("public-message", messages);
    } catch {
      console.log("public chat not found");
    }

    const users = await userController.getUsers({});
    io.sockets.connected[clients[uid].socket].emit("getUsers", users);
  });

  socket.on('private-message', async (data) => {
    console.log("Sender: " + data.sendername + " Sending: " + data.content + " to " + data.username);
    uid = data.username;

    const senderuser = await userController.getUsers({
      name: data.sendername
    });
    const senderUid = senderuser[0] ? senderuser[0].uid : null

    const recuser = await userController.getUsers({
      name: data.username
    });
    const recUid = recuser[0] ? recuser[0].uid : null

    if (clients[recUid]) {
      io.sockets.connected[clients[recUid].socket].emit("add-message", data);

      let found = false;
      for (const chat of senderuser[0].chats) {
        if (chat.friendId === recUid) {
          found = true;
          break;
        }
      }
      if (found) {
        const update = {
          $push: {
            'chats.$.messages': {
              author: data.sendername,
              message: data.content
            }
          }
        }
        userController.updateUser({
          name: data.sendername,
          'chats.friendId': recUid
        }, update, {
          runValidators: true
        })

      } else {
        const update = {
          $push: {
            "chats": {
              friendId: recUid,
              messages: [{
                author: data.sendername,
                message: data.content
              }]
            }
          }
        }
        userController.updateUser({
          name: data.sendername
        }, update, {
          runValidators: true
        })
      }
      // ------------------------------- Reciever db update ----------------------------------
      found = false;
      for (const chat of recuser[0].chats) {
        if (chat.friendId === senderUid) {
          found = true;
          break;
        }
      }
      if (found) {
        const update = {
          $push: {
            'chats.$.messages': {
              author: data.senderUid,
              message: data.content
            }
          }
        }
        userController.updateUser({
          name: data.username,
          'chats.friendId': recUid
        }, update, {
          runValidators: true
        })

      } else {
        const update = {
          $push: {
            "chats": {
              friendId: senderUid,
              messages: [{
                author: data.sendername,
                message: data.content
              }]
            }
          }
        }
        userController.updateUser({
          name: data.username
        }, update, {
          runValidators: true
        })
      }

    } else {

      const user = await userController.getUsers({
        uid: data.username
      });
      let flag = 0;
      for (const chat of user[0].chats) {
        if (chat.friendId === data.sendername) {
          flag = 1;
          break;
        }
      }

      if (flag === 0) {
        const update = {
          $push: {
            "chats": {
              friendId: recUid,
              messages: [{
                author: data.sendername,
                message: data.content
              }]
            }
          }
        }

        userController.updateUser({
          name: data.sendername
        }, update, {
          runValidators: true
        })
        const update1 = {
          $push: {
            "chats": {
              friendId: senderUid,
              messages: [{
                author: data.sendername,
                message: data.content
              }]
            }
          }
        }
        userController.updateUser({
          name: data.username
        }, update1, {
          runValidators: true
        })
      } else {
        const update = {
          $push: {
            'chats.$.messages': {
              author: data.sendername,
              message: data.content
            }
          }
        }
        userController.updateUser({
          name: data.sendername,
          'chats.friendId': recUid
        }, update, {
          runValidators: true
        })

        const update1 = {
          $push: {
            'chats.$.messages': {
              author: data.sendername,
              message: data.content
            }
          }
        };
        userController.updateUser({
          name: data.username,
          'chats.friendId': data.sendername
        }, update1, {
          runValidators: true
        })

      }
      console.log("User does not exist: " + recUid);
    }
  });

  //Removing the socket on disconnect
  socket.on('disconnect', function () {
    for (var name in clients) {
      if (clients[name].socket === socket.id) {
        delete clients[name];
        break;
      }
    }
  })
});