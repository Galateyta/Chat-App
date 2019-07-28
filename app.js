const express = require('express');
const app = express();
const fs = require('fs');
const userController = require('./controllers/user.js');

const server = app.listen(4000);
const io = require('socket.io')(server);

const clients = {};
let uid ;

console.log("Server running on 4000 port");
app.get('/', (req, res) => {
  console.log("read file ");  
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

  //senc and recive public message
  socket.on('public-message', function(publicData){

    const updateMess = {
      $push: {
        publicChat: {messages: {author: publicData.author, message: publicData.message}}
      }
    }  

    //update chat in db
    userController.updateUser({}, updateMess, {runValidators: true});
    io.emit('public-message', publicData);

  });


  socket.on('add-user', async (data) => {

    let uid = data.username;
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

    const user = await userController.getUsers({uid: uid});
    let messages = [];

    for (const chat of user[0].chats) {
      messages = messages.concat(chat.messages);
    }

    let pMessages = [];
    try {
      for (const chat of user[0].publicChat) {
        pMessages = pMessages.concat(chat.messages);
      }
      
      //send message to the client
      socket.emit("public-message", pMessages);
      
    } catch {
      console.log("public chat chi gtnvel");
      
    }

    //send private message ti the client
    io.sockets.connected[clients[uid].socket].emit("getAllMessages", messages);

    const users = await userController.getUsers({});
    io.sockets.connected[clients[uid].socket].emit("getUsers", users);

  });

  socket.on('private-message', async (data) => {

     uid = data.username;

    console.log("Sender: " + data.sendername + " Sending: " + data.content + " to " + data.username);

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

      //console.log('found1', found);
      if (found) {
        
        const update = {
          $push: {
            chats : {messages: {author: data.sendername, message: data.content, receiver:data.username}}
          }
        }      

        userController.updateUser({name: data.sendername}, update, {runValidators: true});

        const user1 = await userController.getUsers({uid: uid});
        
        let messages = [];
        for (const chat of user1[0].chats) {
          messages = messages.concat(chat.messages);
        }
        
        io.sockets.connected[clients[uid].socket].emit("getAllMessages", messages);
        console.log(messages);
        

      } else {
        
        const update = {
          $push: {
            chats: {messages: {author: data.sendername,  message: data.content, receiver:data.username}}
          }
        }
        
        userController.updateUser({name: data.sendername}, update, {runValidators: true});
        userController.updateUser({name: data.username}, update, {runValidators: true});

        const user1 = await userController.getUsers({uid: uid});
        let messages = [];

        for (const chat of user1[0].chats) {
          messages = messages.concat(chat.messages);
        }
        
        io.sockets.connected[clients[uid].socket].emit("getAllMessages", messages);
        console.log(messages);        

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
            chats: {messages: {author: senderUid, message: data.content,receiver:data.username}}
          }
        }

        userController.updateUser({name: data.username}, update, {runValidators: true})
        const user1 = await userController.getUsers({uid: uid});
        let messages = [];

        for (const chat of user1[0].chats) {
          messages = messages.concat(chat.messages);
        }
        
        io.sockets.connected[clients[uid].socket].emit("getAllMessages", messages);
        console.log(messages);
        
      } else {
        
        const update = {
          $push: {
            chats: {messages: {author: data.sendername, message: data.content, receiver:data.username}}
          }
        }

        userController.updateUser({name: data.username}, update, {runValidators: true})
        const user1 = await userController.getUsers({uid: data.username});
        let messages = [];

        for (const chat of user1[0].chats) {
          messages = messages.concat(chat.messages);
        }
        
        io.sockets.connected[clients[uid].socket].emit("getAllMessages", messages);
        console.log(messages);
        

      }
    } else {
   //   console.log("User does not exist: " + recUid);
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