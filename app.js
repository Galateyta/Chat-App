// var app = require('http').createServer(handler)
const express = require('express');
const app = express();
const fs = require('fs');
const userController = require('./controllers/user.js');

const server = app.listen(5000);
const io = require('socket.io')(server);

var clients = {};

console.log("server running 5000 port");
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
  socket.on('add-user', function (data) {
    const user = {uid: data.username,
      name: data.username,
      friends: [],
      chats: [{
          friendId: data.sendername, // stex exnelu a voch te name@ ayl uid-n
          messages: [{
              author: data.sendername, // voch te senc ayl $push ov vor exac@ chjnjvi
              message: data.content
          }]
      }]}
    userController.addUser(user)

    clients[data.username] = {
      "socket": socket.id
    };
    console.log(clients);
  });

  socket.on('private-message', function (data) {
    console.log("Sender: " + data.sendername + " Sending: " + data.content + " to " + data.username);
    if (clients[data.username]) {
      io.sockets.connected[clients[data.username].socket].emit("add-message", data);
    } else {
      console.log("User does not exist: " + data.username);
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