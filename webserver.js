var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); // Require filesystem module
var io = require('socket.io')(http) // Require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; // Include onoff to interact with the GPIO
var OP = new Gpio(516, 'low'); // Use GPIO pin 4 as output (OP) // Start in the off state
var pushButton = new Gpio(529, 'in', 'rising'); // Use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

// Variable definitions
var http_port = 8080;
var timers = [];
var timeout = 500; // Timer timeout in ms
var mysockets = [];

// Start the http server
http.listen(http_port);

// Function to toggle the GPIO output
var fn_toggle_output = function toggle_output()  {
  // console.log('Toggling output');

  value = OP.readSync();
  OP.writeSync( 1 - value ); // Toggle output

  for (var mysocket of mysockets) {
    if (typeof(mysocket) != 'undefined') {
      try {
        // console.log(1-value);
        mysocket.emit('light', 1 - value); // Send button status to client
      }
      catch (e) {
        console.log('Error: ', e);
      }
    }
  };
} 

// Watch for hardware interrupts on pushButton
pushButton.watch(function (err, value) {
  if (err) { // handle any errors generated
    console.error('There was an error', err); //output error message to console
    return;
  }

  // Debounce any spurious inputs by setting a new timer to toggle the output
  // console.log('Button pressed');
  timers.push(setTimeout(fn_toggle_output, timeout));

  // Clear all old timers
  for (var i = 0; i < (timers.length) - 1; i++) {
    clearTimeout(timers[i]);
  }

  // Then clear the timer array
  timers = [];
  
});

function handler (req, res) { // Create server

  req.url.replace(/\.\.\//g,'') // Prevent directory escape

  if (req.url == '/') { req.url = '/index.html'; }

    encoding = '';
    if (req.url.match(/.html$/) || req.url.match(/.css$/)) {
      encoding = 'utf8';
    }

    fs.readFile(__dirname + '/public' + req.url, encoding, function(err, data) { // Read file in public folder

    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); // Display 404 on error
      return res.end("404 Not Found");
    }

    // Match queries for html files
    if (req.url.match(/.html$/)) {
      if (OP.readSync() == 0) {
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

    res.write(data); // Return data to client

    return res.end();
  });
}

io.sockets.on('connection', function (socket) { // WebSocket Connection
  // console.log('Client connected');
  lightvalue = 0; // static variable for current status
  mysockets.push(socket);
  // console.log(mysockets.length);

  // Handle disconnects
  socket.on('disconnect', function () {
    index = mysockets.indexOf(socket);
    if ( index > -1 ) {
      mysockets.splice(index, 1);
    }
  });

  socket.on('light', function(data) { // Get light switch status from client
    // console.log('client');
    lightvalue = data; // Invert value

    if (lightvalue != OP.readSync()) { // Only change OP if status has changed
      OP.writeSync(lightvalue); // Turn OP on or off
    }

    for (var mysocket of mysockets) {
      if (typeof(mysocket) != 'undefined') {
        mysocket.emit('light', lightvalue); // Send button status to clients
      }
    };

  });
});



process.on('SIGINT', function () { //on ctrl+c
  OP.writeSync(0); // Turn output off
  OP.unexport(); // Unexport output GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); // Exit completely
});
