var events = {};
var eventUid = 0;

var socket = io.connect('http://localhost/server');

socket.on('addEvent', function (event) {
    events[event.socket+"-"+event.id] = event;
    printEvents();
  });
  
socket.on('delEvent', function (event) {
    delete events[event.socket+"-"+event.id];
    printEvents();
  });

function delEvent(event) {
  var itemSplit = event.split("-");
  socket.emit('delEvent', {"socket":itemSplit[0], "id":itemSplit[1]});
}

function printEvents() {
  document.getElementById("events").innerHTML = "";
  for(var item in events) {
    document.getElementById("events").innerHTML +=
      events[item].socket+" - "+events[item].id+" - "+events[item].title + " <a onclick=\"javascript:delEvent('"+item+"')\" href=\"javascript:void(0);\">Del</a><br />"
  }
}
