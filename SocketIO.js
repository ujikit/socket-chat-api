const http = require('http');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const bodyParser = require('body-parser');
const io = require('socket.io').listen(server);
const mysql = require('mysql');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

users = [];
connections = [];

let connection = mysql.createConnection({
	host : "localhost",
	user : "user",
	password : "",
	database : "chat"
});

server.listen(8080);
console.log('Server is running...');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/users', (req, res) => {
  let query = `SELECT * FROM users`;
	connection.query(query, function (err, result) {
		if (err) throw err
		console.log('user_data', result)
	})
})

io.sockets.on('connection', socket => {

  users.push({
    id_socket: socket.id,
    username_socket: ''
  });


  io.sockets.emit("get_online_users", {
    users,
    users_count: users.length,
  });

  console.log("Berhasil terkoneksi : ", socket.id);
  console.log("Total berhasil terkoneksi : ", users.length);

  // [DISCONNECTED USER]
  socket.on('disconnect', data => {
    console.log('Got disconnect!');

    let removeIndex = users.map(function(item) { return item.id_socket; }).indexOf(socket.id);
    users.splice(removeIndex, 1);

    io.sockets.emit("get_online_users", {
      users,
      users_count: users.length,
    });
  });

  socket.on('get_online_users', data => {
    io.sockets.emit("get_online_users", {
      users,
      users_count: users.length,
    });
  });

  socket.on('set_username_socket', data => {
    if (data.id_socket === socket.id) {
      let itemIndex = users.findIndex((item => item.id_socket == data.id_socket));
      users[itemIndex].username_socket = data.username_socket
    }

    io.sockets.emit("get_online_users", {
      users,
      users_count: users.length,
    });
  });

  // get receipt target
  app.post('/get-receipt-target', (req, res) => {
    let {id_socket, username_socket} = req.body;
    res.status(200).json(req.body);
  });

  // send message [PRIVATE]
  // app.post('/send-message', (req, res) => {
  //   let {id_socket, message} = req.body;
  //   res.status(200).json(req.body);
  //
  //   // trigger new message to view
  //   console.log(`send to ${id_socket}`);
  //   io.to(`${id_socket}`).emit('private message', {
  //     id_socket: id_socket,
  //     msg: message,
  //   });
  // });

  // send message [PUBLIC]
  socket.on('send message', (data) => {
    // trigger new message to view
    io.to(`${data.id_socket}`).emit('private message', {
      id: new Date().getTime(),
      id_socket: data.id_socket,
      sender_id_socket: data.sender_id_socket,
      username_socket: data.username_socket,
      message: data.message,
    })
  })
});
