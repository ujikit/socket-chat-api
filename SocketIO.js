const express = require('express');
const app = express();
const server = require('http').createServer(app);
const bodyParser = require('body-parser');
const io = require('socket.io')(server, {
  serveClient: false,
  pingInterval: 115000,
  pingTimeout: 115000,
  cookie: false
});
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // untuk akses node modules

server.listen(8080);
console.log('Server is running in: http://localhost:8080');

let date_now = new Date().getTime();

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
      message: 'Succesfully logged in.',
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
    username_socket: '',
		id_user: '',
		role_user: '',
  });

  io.sockets.emit("get_online_users", {
    users,
    users_count: users.length,
  });

  console.log("[CONNECTED]:", socket.id, `(Total ${users.length})`);

  // [DISCONNECTED USER]
  socket.on('disconnect', data => {
    console.log('[DISCONNECT]:', socket.id, `(Total ${users.length})`, `(${data})`);

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
      users[itemIndex].id_user = data.id_user
      users[itemIndex].role_user = data.role_user
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

		// if Member send message to Customer Service then send it (emit) to all Customer Service with loop
		if (data.role_user == 'member') {
			for (var i = 0; i < users.length; i++) {
				if (users[i].role_user == 'customer_service') {
					io.to(users[i].id_socket).emit('private message', {
						id: date_now,
						id_socket_target: data.id_socket,
						id_socket_sender: data.sender_id_socket,
						id_user_sender: data.id_user_socket,
						username_sender: data.username_socket,
						message: data.message
					})
				}
			}
		}
		else {
			try {
				// trigger new message to view
				io.to(data.id_socket).emit('private message', {
					id: date_now,
					id_socket_target: data.id_socket,
					id_socket_sender: data.sender_id_socket,
					id_user_sender: data.id_user_socket,
					username_sender: data.username_socket,
					message: data.message
				})
			} catch (e) {
				console.log('error', JSON.stringify(e));
			}
		}

  })

  socket.on('blast_notification_to_backend', (body) => {
		console.log('blast_notification_to_backend', body);

		let {
			title,
			message,
			data
		} = body;
		io.sockets.emit('blast_notification_to_frontend', {
			title,
			message,
			data
		})
  })
});
