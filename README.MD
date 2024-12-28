# HeatingPi

Simple device control based on a Raspberry Pi and a relay module.

Intended so I can turn my boilier on and off remotely, but could be used for a variety of things.

Credits:

## Build process

Install Raspbery OS on a suitable device (Pi Zero upwards)
Install any updates and reboot if required
```
sudo apt update
sudo apt upgrade
sudo reboot
```
Install node and npm
```
sudo apt install nodejs
sudo apt install npm
```
Check installation and versions
```
npm -v
node -v
```

Create a parent folder to hold the project files (optional)
```
mkdir ~/git
```
Clone the repo into it
```
cd ~/git
git clone https://github.com/iainfm/HeatingPi.git
```

Install node modules
```
cd HeatingPi
npm init -y
npm install socket.io
npm install onoff
npm install pigpio
sudo npm install pm2 -g # optional - only if you want to use this to control run on boot etc
```


Test the server
```
node webserver.js
```
## Install to run on boot (optional)
```
pm2 startup
# The next line will be returned by the first
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u <user> --hp <path>
cd <folder containing webserver.js>
pm2 start webserver.js
pm2 save
pm2 status
```

# Connect the relay module

**These are the way *my* relay module works. Always check the wiring instructions to lower the risk of damage to your devices (or you).**

|Rasperry Pi Pin|Description|Relay Module Pin|
|-|-|-|
|2|+5V|DC+|
|6|GND|DC-|
|7|GPIO 4|IN|

For external switch control, wire a suitable SPST non-latching switch between GPIO 17 (Pin 11) and 3.3V with a ~4.7K pulldown resistor between GPIO17 and GND.

# Automatic Scheduling

Simplest, but least user-friendly option is to use cron. Set your on-off schedule and use the commands in cron_on/cron_off as the task to run.

# Credits

[W3Schools](https://www.w3schools.com/nodejs/nodejs_raspberrypi_webserver_websocket.asp) for the basis of the webserver code.

(TBC) for the favicon.