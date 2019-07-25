const express = require('express');
const app = express();

const server = app.listen(4000, function() {
    console.log('listening on localhost:3000');
});
const io = require('socket.io')(server);

app.use(express.static('./'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

users = [];

const limits = {};

io.on('connection', function(socket) {
    console.log('A user connected');

    socket.on('setUsername', function(data) {
        console.log(data);

        if (users.indexOf(data) > -1) {
            socket.emit('userExists', data + ' username is taken! Try some other username.');
        } else {
            socket.username = data;
            users.push(data);
            socket.emit('userSet', {
                username: data
            });
        }
    });

    socket.on('msg', function(data) {
        //Send message to everyone
        io.sockets.in(data.room).emit('newmsg', data);
    });


    socket.on('createRoom', (roomName) => {
        if (!limits.hasOwnProperty(roomName)) {
            limits[roomName] = {currentRoomCount: 0, maxRoomCount: 2};
        }
        if (limits[roomName].currentRoomCount >= limits[roomName].maxRoomCount) {
            console.log('I\'m sorry, too many connections');
            socket.emit('disconnect', 'I\'m sorry, too many connections');
            socket.disconnect();
        } else {
            limits[roomName].currentRoomCount++;
            for(const room in io.sockets.adapter.rooms){
                socket.leave(room);
            }
            const room = socket.join(roomName);
            room.on('leave', function() {
                console.log('leave');
                limits[roomName].currentRoomCount--;
            });
        }
    });
});
