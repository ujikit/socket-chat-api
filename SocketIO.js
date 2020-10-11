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

app.post('/login', (req, res) => {
  console.log('request_data', req.body);
  let {username} = req.body;
  let query = `SELECT * FROM users WHERE username='${username}'`;
	connection.query(query, function (err, result) {
    console.log('user_data', result);

		if (err) throw err
    if (!result.length) {
      return res.json({
        code: 401,
        message: 'Pengguna tidak ditemukan.',
        data: []
      })
    }

    return res.json({
      code: 200,
      message: 'Login berhasil.',
      data: result
    })
	})
})

app.put('/set-id-socket-user', (req, res) => {
  console.log('[request_data] /set-id-socket-user =>', req.body);

  let {username, id_socket} = req.body;
  let query = `UPDATE users SET id_socket='${id_socket}' WHERE username='${username}'`;
	connection.query(query, function (err, result) {
    console.log('set_socket_id_data', result);

		if (err) throw err
    return res.json({
      code: 200,
      message: `Update id socket pengguna ${username} berhasil. ${id_socket}`,
      data: result
    })
	})
})

app.get('/show-user/:username', (req, res) => {
	console.log('[request_data] /show_user/:username =>', req.body);

	let {username} = req.params;
  let query = `SELECT * FROM users where username = '${username}'`;
	connection.query(query, function (err, result) {
		if (err) throw err
		console.log('user_data', result);
    res.json(result);
	})
})

app.get('/conversations/:username', (req, res) => {
	console.log('[request_data] /conversations =>', req.params);

	let {username} = req.params;
  let query = `SELECT * FROM conversations WHERE sender_username = '${username}' OR receiver_username = '${username}'`;
	connection.query(query, function (err, result) {
		if (err) throw err
		console.log('conversations_data', result);
    res.json(result);
	})
})

app.get('/conversation-messages/:username/:receiver_username', (req, res) => {
	console.log('[request_data] /conversation-messages/:username/:receiver_username =>', req.params);

	let {username, receiver_username} = req.params;
  let query = `SELECT * FROM conversations WHERE sender_username = '${username}' OR receiver_username = '${username}' OR sender_username = '${receiver_username}' OR receiver_username = '${receiver_username}'`;
	connection.query(query, function (err, result) {
		if (err) throw err
		console.log('conversations_data', result);
    res.json(result);
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
    console.log(`${socket.id} is disconnect.`);

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

  // send message [PUBLIC]
  socket.on('send message', (data) => {
    // trigger new message to view
    io.to(`${data.id_socket_target}`).emit('private message', {
      id: new Date().getTime(),
      id_socket_target: data.id_socket_target,
      id_socket_sender: data.id_socket_sender,
      username_sender: data.username_sender,
      message: data.message
    })
  })
});
