const express = require("express");
const app = express();
const http = require("http");
// const https = require("https"); // comment if only http
const bodyParser = require("body-parser");
const { networkInterfaces } = require("os");

// var privateKey = fs.readFileSync("????.key", "utf8"); // comment if only http
// var certificate = fs.readFileSync("????.crt", "utf8"); // comment if only http
// var credentials = { key: privateKey, cert: certificate }; // comment if only http
const httpServer = http.createServer(app);
// const httpsServer = https.createServer(credentials, app); // comment if only http

// if running in http, use: httpServer,
// if running in https, use: httpsServer,
const io = require("socket.io")(httpServer, {
  serveClient: false,
  pingInterval: 115000,
  pingTimeout: 115000,
  cookie: false
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

users = [];
connections = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // untuk akses node modules

httpServer.listen(8080);
// httpsServer.listen(8081); // comment if only http

const getIpAddress = () => {
  const nets = networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }
  return results;
};

console.log(`\n[OK] Server is running on port 8080\n`);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.put("/set-id-socket-user", (req, res) => {
  console.log("[request_data] /set-id-socket-user =>", req.body);
});

app.get("/show-user/:username", (req, res) => {
  console.log("[request_data] /show_user/:username =>", req.body);
});

app.get("/conversations/:username", (req, res) => {
  console.log("[request_data] /conversations =>", req.params);
});

app.get("/conversation-messages/:username/:receiver_username", (req, res) => {
  console.log(
    "[request_data] /conversation-messages/:username/:receiver_username =>",
    req.params
  );
});

io.sockets.on("connection", socket => {
  users.push({
    id_socket: socket.id,
    username_socket: "",
    id_user: "",
    role_user: ""
  });

  io.sockets.emit("get_online_users", {
    users,
    users_count: users.length
  });

  console.log("[CONNECTED]:", socket.id, `(Total ${users.length})`);

  // [DISCONNECTED USER]
  socket.on("disconnect", data => {
    console.log(
      "[DISCONNECT]:",
      socket.id,
      `(Total ${users.length})`,
      `(${data})`
    );

    const removeIndex = users
      .map(function(item) {
        return item.id_socket;
      })
      .indexOf(socket.id);
    users.splice(removeIndex, 1);

    io.sockets.emit("get_online_users", {
      users,
      users_count: users.length
    });
  });

  socket.on("get_online_users", data => {
    io.sockets.emit("get_online_users", {
      users,
      users_count: users.length
    });
  });

  socket.on("set_username_socket", data => {
    if (data.id_socket === socket.id) {
      const itemIndex = users.findIndex(
        item => item.id_socket == data.id_socket
      );
      users[itemIndex].username_socket = data.username_socket;
      users[itemIndex].id_user = data.id_user;
      users[itemIndex].role_user = data.role_user;
    }

    io.sockets.emit("get_online_users", {
      users,
      users_count: users.length
    });
  });

  // get receipt target
  app.post("/get-receipt-target", (req, res) => {
    const { id_socket, username_socket } = req.body;
    res.status(200).json(req.body);
  });

  // send message [PUBLIC]
  socket.on("send message", data => {
    // if Member send message to Customer Service then send it (emit) to all Customer Service with loop
    if (data.role_user == "member") {
      for (var i = 0; i < users.length; i++) {
        if (users[i].role_user == "customer_service") {
          io.to(users[i].id_socket).emit("private message", {
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
        io.to(data.id_socket).emit("private message", {
          id: new Date().getTime(),
          id_socket_target: data.id_socket,
          id_socket_sender: data.sender_id_socket,
          id_user_sender: data.id_user_socket,
          username_sender: data.username_socket,
          message: data.message
        });
      } catch (e) {
        console.log("error", JSON.stringify(e));
      }
    }
  });

  socket.on("blast_notification_to_backend", body => {
    console.log("blast_notification_to_backend", body);

    const { title, message, data } = body;
    io.sockets.emit("blast_notification_to_frontend", {
      title,
      message,
      data
    });
  });
});
