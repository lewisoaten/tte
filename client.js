var socket;
var id;
var events = {};
var eventUid = 0;

function start() {
  socket = io.connect('http://localhost');
  
  socket.on('addEvent', function (event) {
    addEvent(event);
  });
  
  socket.on('delEvent', function (event) {
    delEvent(event.id);
  });

  document.getElementById("new").innerHTML = "<a onclick=\"javascript:addEvent(prompt('Event title', 'client test'))\" href=\"javascript:void(0);\">New</a>";
}

function addEvent(title) {
  var eventId = eventUid;
  eventUid++;
  events[eventId] = {"title":title, "confirmed":false};
  printEvents();
  
  socket.emit('addEvent', {"id":eventId, "title":title}, function() {
    events[eventId].confirmed = true;
    printEvents();
  });
  
  return eventId;
}

function delEvent(id) {
  delete events[id];
  printEvents();
  
  socket.emit('delEvent', {"id":id}, function() {
    alert("Event has been successfully removed from the server.");
  });
}

function printEvents() {
  document.getElementById("events").innerHTML = "";
  for(var item in events) {
    document.getElementById("events").innerHTML +=
      events[item].title + " <a onclick=\"javascript:delEvent("+item+")\" href=\"javascript:void(0);\">Del</a>";
    if(events[item].confirmed)
      document.getElementById("events").innerHTML +=
        " - Successfully synced with server!";
    document.getElementById("events").innerHTML += "<br />";
  }
}
