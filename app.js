// var app = require('http').createServer(handler)
const express = require('express');
const app = express();
const fs = require('fs');
const userController = require('./controllers/user.js');

const server = app.listen(4000);
const io = require('socket.io')(server);

var clients = {};

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
  socket.on('add-user', async (data) => {
    console.log('add-user');
    let uid = data.username;
    const body = {
      uid: uid,
      name: data.username,
      friends: [],
      chats: []
    };

    const result = await userController.addUser(body);
    if (result) {
      console.log('there is user by id', result);
      uid = result;
    }

    clients[uid] = {
      "socket": socket.id
    };

    const user = await userController.getUsers({uid: uid});
    console.log(user);
    let messages = [];
    for (const chat of user[0].chats) {
      messages = messages.concat(chat.messages);
    }
    
    io.sockets.connected[clients[uid].socket].emit("getAllMessages", messages);

    const users = await userController.getUsers({});
    io.sockets.connected[clients[uid].socket].emit("getUsers", users);

    console.log(clients);
  });

  socket.on('private-message', async (data) => {
    console.log("Sender: " + data.sendername + " Sending: " + data.content + " to " + data.username);
    const senderuser = await userController.getUsers({
      name: data.sendername
    });
    const senderUid = senderuser[0] ? senderuser[0].uid : null

    const recuser = await userController.getUsers({
      name: data.username
    });
    console.log(data.username, recuser);
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
      console.log('found1', found);
      if (found) {
        const update = {
          $push: {
            'chats.$.messages': {author: data.sendername, message: data.content}
          }
        }        
        userController.updateUser({name: data.sendername, 'chats.friendId': recUid}, update, {runValidators: true})
      } else {
        const update = {
          chats: [{
            friendId: recUid,
            messages: [{author: data.sendername, message: data.content}],
          }]
        }
        userController.updateUser({name: data.sendername}, update, {runValidators: true})
      }

      // -----------------------------------------------------------------
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
            'chats.$.messages': {author: senderUid, message: data.content}
          }
        }
        userController.updateUser({name: data.username, 'chats.friendId': data.sendername}, update, {runValidators: true})

      } else {
        const update = {
          chats: [{
            friendId: senderUid,
            messages: [{author: data.sendername, message: data.content}],
          }]
        }
        userController.updateUser({name: data.username}, update, {runValidators: true})
      }
    } else {
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