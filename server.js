var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , path = require('path')
  
//TODO: Validate requirements with sequence diagram, this implementation is far
// from optimal
  
//TODO: These maps could be in a better data structure
var clientMap = {};
var eventMap = {};
var serverSocket;
  
//Here is the code that deals with our clients
var client = io.of('').on('connection', function (socket) {
    
  //We need to store each client in the client map for server deletions
  clientMap[socket.id] = socket;
  
  //Send a new event to the client, repeat every 30 seconds
  timer = setInterval(function(){
    //Fire and forget, confirmation will come back as an addEvent
    socket.emit('addEvent', "server test")
    }, 30000);
  
  socket.on('addEvent', function (event, callback) {
    eventMap[socket.id+"-"+event.id] = {"socket":socket.id, "id":event.id, "title":event.title};
    
    //Now send update on our server socket - if it exists
    if(typeof serverSocket !== "undefined")
      serverSocket.emit('addEvent', eventMap[socket.id+"-"+event.id]);
      
    callback();
  });
  
  socket.on('delEvent', function (event, callback) {
    delete eventMap[socket.id+"-"+event.id];
    
    //Now send update on our server socket - if it exists
    if(typeof serverSocket !== "undefined")
      serverSocket.emit('delEvent', {"socket":socket.id, "id":event.id});
      
    callback();
  });
  
  socket.on('disconnect', function () {
    //No longer needed in our client map
    delete clientMap[socket.id];
    
    //Clean up any left over events - this code has got very hacky and needs
    // refactorying. Will be improved with better data structures
    for(var item in eventMap) {
      var itemSplit = item.split("-");
      if(itemSplit[0] == socket.id) {
        delete eventMap[item];
        if(typeof serverSocket !== "undefined")
          serverSocket.emit('delEvent', {"socket":itemSplit[0], "id":itemSplit[1]});
      }
    }
  });
});

//Here is the code that talks to the server
var server = io.of('/server').on('connection', function (socket) {
  serverSocket = socket;
  
  for(var item in eventMap) {
    serverSocket.emit('addEvent', eventMap[item]);
  }
  
  socket.on('delEvent', function (event) {
    //Fire and forget, confirmation will come back as an delEvent
    clientMap[event.socket].emit('delEvent', event);
  });
  
  socket.on('disconnect', function () {
    delete serverSocket;
  });
});


//Quick and dirty node.js web server
app.listen(80);

function handler (req, res) {
  //TODO: Following code insecure, requires hardening before production
  //Get any url they ask for
  var filePath = '.' + req.url;
  if (filePath == './')
    filePath = './index.htm';
    
  var mimeMap = { '.html':'text/html',
                  '.js':'text/javascript'}
    
  path.exists(filePath, function(exists) {
        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    res.writeHead(500);
                    res.end();
                }
                else { //The file they requested exists and can be read
                    res.writeHead(200, { 'Content-Type': mimeMap[path.extname(filePath)] });
                    res.end(content, 'utf-8');
                }
            });
        }
        else {
            res.writeHead(404);
            res.end();
        }
    });
}
