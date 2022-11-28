const express = require('express');
const { readFileSync } = require('fs');
const { createServer } = require('https');
const { Server } = require('socket.io');

const app = express();
const httpsServer = createServer({
  key: readFileSync('/path/to/my/key.pem'),
  cert: readFileSync('/path/to/my/cert.pem')
});

const io = new Server(httpsServer, {
  serveClient: false,
  pingInterval: 900000,
  pingTimeout: 20000
});

users = [];
connections = [];

app.use(express.static(__dirname)); // untuk akses node modules

console.log(`\n[OK] Server is running on port 8082\n`);

app.get('/', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.put('/set-id-socket-user', req => {
  console.log('[request_data] /set-id-socket-user =>', req.body);
});

app.get('/show-user/:username', req => {
  console.log('[request_data] /show_user/:username =>', req.body);
});

app.get('/conversations/:username', req => {
  console.log('[request_data] /conversations =>', req.params);
});

app.get('/conversation-messages/:username/:receiver_username', req => {
  console.log(
    '[request_data] /conversation-messages/:username/:receiver_username =>',
    req.params
  );
});

io.on('connection', socket => {
  users.push({
    id_socket: socket.id,
    username_socket: '',
    id_user: '',
    role_user: ''
  });

  io.sockets.emit('get_online_users', {
    users,
    users_count: users.length
  });

  console.log('[CONNECTED]:', socket.id, `(Total ${users.length})`);

  // [ERROR USER]
  io.engine.on('connection_error', err => {
    //
    if (users.length) {
      console.log('==== connection_error ====');
      // console.log(err.req); // the request object
      console.log(err.code); // the error code, for example 1
      console.log(err.message); // the error message, for example "Session ID unknown"
      console.log(err.context); // some additional error context
      console.log('==== ./connection_error ====');
    }
  });

  // [DISCONNECTED USER]
  socket.on('disconnect', data => {
    console.log(`[DISCONNECT]: ${socket.id} (Total ${users.length})`);
    console.log(data);
    console.log('=== [DISCONNECT] ===');

    const removeIndex = users
      .map(function (item) {
        return item.id_socket;
      })
      .indexOf(socket.id);
    users.splice(removeIndex, 1);

    io.sockets.emit('get_online_users', {
      users,
      users_count: users.length
    });
  });

  socket.on('get_online_users', data => {
    io.sockets.emit('get_online_users', {
      users,
      users_count: users.length
    });
  });

  socket.on('set_username_socket', data => {
    if (data.id_socket === socket.id) {
      const itemIndex = users.findIndex(
        item => item.id_socket == data.id_socket
      );
      users[itemIndex].username_socket = data.username_socket;
      users[itemIndex].id_user = data.id_user;
      users[itemIndex].role_user = data.role_user;
    }

    io.sockets.emit('get_online_users', {
      users,
      users_count: users.length
    });
  });

  // get receipt target
  app.post('/get-receipt-target', (req, res) => {
    res.status(200).json(req.body);
  });

  // send message [PUBLIC]
  socket.on('send message', data => {
    // if Member send message to Customer Service then send it (emit) to all Customer Service with loop
    if (data.role_user === 'member') {
      for (var i = 0; i < users.length; i++) {
        if (users[i].role_user === 'customer_service') {
          io.to(users[i].id_socket).emit('private message', {
            id: new Date().getTime(),
            id_socket_target: data.id_socket,
            id_socket_sender: data.sender_id_socket,
            id_user_sender: data.id_user_socket,
            username_sender: data.username_socket,
            message: data.message
          });
        }
      }
    } else {
      try {
        // trigger new message to view
        io.to(data.id_socket).emit('private message', {
          id: new Date().getTime(),
          id_socket_target: data.id_socket,
          id_socket_sender: data.sender_id_socket,
          id_user_sender: data.id_user_socket,
          username_sender: data.username_socket,
          message: data.message
        });
      } catch (e) {
        console.log('error', JSON.stringify(e));
      }
    }
  });

  socket.on('blast_notification_to_backend', body => {
    console.log('blast_notification_to_backend', body);

    const { title, message, data } = body;
    io.sockets.emit('blast_notification_to_frontend', {
      title,
      message,
      data
    });
  });
});

httpServer.listen(8082);
