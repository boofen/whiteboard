var express = require("express"), 
    app = express(),
    http = require("http"),
    socketIo = require("socket.io");

// Start server on port 8080.
var server =  http.createServer(app);
var io = socketIo.listen(server);
server.listen(process.env.PORT || 8080, () => console.log("Server is running on port 8080."));

app.use(express.static(__dirname + "/public"));

var line_history = []; // Array of drawn lines.
var text_history = []; // Array of written text.

// Event-handler for new incoming connections.
io.on("connection", function(socket) {
    // Firstly, send the drawing history to the new client...
    for (var i in line_history) {
        socket.emit("draw_line", {line: line_history[i]});
    };

    // ... And the text history.
    for (var i in text_history) {
        socket.emit("draw_text", {text: text_history[i]});
    };

    // Add handler for message type "draw_line".
    socket.on("draw_line", function(data) {
        // Add received line to history.
        line_history.push(data.line);

        // Send line to all clients.
        io.emit("draw_line", {line: data.line});
    });

    // Add handler for message type "draw_text".
    socket.on("draw_text", function(data) {
        // Add received text to history.
        text_history.push(data.text);

        // Send text to all clients.
        io.emit('draw_text', {text: data.text});
    });

    // Add handler for clearing line- and text history.
    socket.on("clear_it", function() {
        line_history = [];
        text_history = [];
        io.emit("clear_it", true);
    });
});
