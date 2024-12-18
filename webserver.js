var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(516, 'low'); //use GPIO pin 4 as output // Start in the off (NO) state
var pushButton = new Gpio(529, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

http.listen(8080); //listen to port 8080

function handler (req, res) { //create server

    if (req.url == '/') { req.url = '/index.html'; }

    encoding = '';
    if (req.url.match(/.html$/) || req.url.match(/.css$/)) {
      encoding = 'utf8';
    }

    fs.readFile(__dirname + '/public' + req.url, encoding, function(err, data) { //read file in public folder

    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    // Match queries for html files
    if (req.url.match(/.html$/)) {
      if (LED.readSync() == 0) {
        data = data.replace("checked_placeholder ", "");
      }
      else {
        data = data.replace("checked_placeholder", "checked");
      }
      res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    }
    // Match queries for css files
    else if (req.url.match(/.css$/)) {
      res.writeHead(200, {'Content-Type': 'text/css'}); //write CSS
    }
    res.write(data); //write data from index.html
    return res.end();
  });
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
  var lightvalue = 0; //static variable for current status
  /* pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton
    if (err) { //if an error
      console.error('There was an error', err); //output error message to console
      return;
    }
    lightvalue = value;
    socket.emit('light', lightvalue); //send button status to client
  });*/
  socket.on('light', function(data) { //get light switch status from client
    lightvalue = data; //invert value
    // console.log(lightvalue, LED.readSync());
    if (lightvalue != LED.readSync()) { //only change LED if status has changed
      LED.writeSync(lightvalue); //turn LED on or off
    }
  });
});

process.on('SIGINT', function () { //on ctrl+c
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); //exit completely
});