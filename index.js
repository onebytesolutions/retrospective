// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

var retros = {};
var users = {};

var random = function(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

io.on('connection', function (socket) {
	
	socket.on('join', function (data) {
		
		var id = data.id;
		if(retros['r'+id] != undefined){
			users[socket.id] = {
				id: id,
				socket: socket
			};
			socket.emit('welcome', retros['r'+id]);
		}else{
			socket.emit('invalid-id', {});
		}
	});	
	
	socket.on('join-new', function (data) {
		
		var id;
		while(true){
			id = random(1000,9999);
			if(retros['r'+id] == undefined){
				
				retros['r'+id] = {
					id: id,
					good: [],
					bad: [],
					ideas: [],
					kudos: []
				}
				
				break;
			}
		}
		users[socket.id] = {
			id: id,
			socket: socket
		};
		socket.emit('welcome', retros['r'+id]);
	});
	
	socket.on('add-message', function (data) {
		var retroId = users[socket.id].id;
		var msg = {type: data.type, message: data.message, owner: socket.id};
		console.log(retroId);
		if(retros['r'+retroId] != undefined){
			if(retros['r'+retroId][data.type] != undefined){
				retros['r'+retroId][data.type].push(msg);
				
				for(var id in users){
					if(users[id].id == retroId){
						users[id].socket.emit('new-message', msg);
					}
				}
			}
		}
	});
	
	socket.on('disconnect', function(data){
		delete users[socket.id];
	});

});