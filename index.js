// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.npm_package_config_port || 8080;

// send index.html when loaded via http
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// listen for sockets
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// storage for retros
var retros = {};

// storage for users
var users = {};

// random number generator
var random = function(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

// handle incoming connections
io.on('connection', function (socket) {
	
    // user requested to join an existing retro
	socket.on('join', function (data) {
		
		var id = data.id;
        
        // ensure requested retro exists
		if(retros['r'+id] != undefined){
			users[socket.id] = {
				id: id,
				socket: socket
			};
            
            // send welcome message along with data
			socket.emit('welcome', retros['r'+id]);
		}else{
			socket.emit('invalid-id', {});
		}
	});	
	
    // user requested to create a retro
	socket.on('create', function (data) {
		
		var id;
        var found = false;
        
        // loop until we find a new retro id
		for(var i=0;i<9999;i++){
			id = random(1000,9999);
            
            // check if this retro id does not exist
			if(retros['r'+id] == undefined){
				
                // create retro storage
				retros['r'+id] = {
					id: id,
					good: [],
					bad: [],
					ideas: [],
					kudos: []
				}
                
                // mark as found
                found = true;
				
                // skip further iterations
				break;
			}
		}
        
        // send response if found
        if(found){
        
            // add user to list
            users[socket.id] = {
                id: id,
                socket: socket
            };
            
            // send welcome message
            socket.emit('welcome', retros['r'+id]);
        }else{
            // no retros available
            socket.emit('invalid-id', {});
        }
	});
	
    // user has sent a message
	socket.on('add-message', function (data) {
		var retroId = users[socket.id].id;
		var msg = {type: data.type, message: data.message, owner: socket.id};
        
        // ensure retro exists
		if(retros['r'+retroId] != undefined){
        
            // ensure box type exists
			if(retros['r'+retroId][data.type] != undefined){
				retros['r'+retroId][data.type].push(msg);
				
                // notify other users
				for(var id in users){
                    // only notify users within this retro
					if(users[id].id == retroId){
						users[id].socket.emit('new-message', msg);
					}
				}
			}
		}
	});
	
    // user has disconnected
	socket.on('disconnect', function(data){
		delete users[socket.id];
        
        // cleanup of retros when last user disconnects
        if(Object.keys(users).length == 0){
            retros = {};
        }
	});

});