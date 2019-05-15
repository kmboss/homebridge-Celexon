var Service, Characteristic;
var rpio = require('rpio');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-Celexon", "Celexon", CelexonAccessory);
}

function CelexonAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.bulbName = config["Celexon"] || this.name; 
  this.binaryState = 0; 
  this.log("Starte Schalter mit dem Namen '" + this.bulbName + "'...");
  this.pinUp = config['pinUp'];
  this.pinDown = config['pinDown'];
  this.pinStop = config['pinStop'];
  this.duration = config['durationDown']

  //  this.search();

  this.infoService = new Service.AccessoryInformation();
  this.infoService
    .setCharacteristic(Characteristic.Manufacturer, 'Krzysztof Milinski')
    .setCharacteristic(Characteristic.Model, 'Celexon')
    .setCharacteristic(Characteristic.SerialNumber, 'Version 1.0.0');

rpio.init({
  //mapping: 'gpio'
  mapping: 'physical'
});

rpio.open(this.pinUp, rpio.OUTPUT, this.initialState);
rpio.open(this.pinDown, rpio.OUTPUT, this.initialState);
rpio.open(this.pinStop, rpio.OUTPUT, this.initialState);

if (this.pinClosed) rpio.open(this.pinClosed, rpio.INPUT, rpio.PULL_UP);
if (this.pinOpen) rpio.open(this.pinOpen, rpio.INPUT, rpio.PULL_UP);
if (this.pinStop) rpio.open(this.pinStop, rpio.INPUT, rpio.PULL_UP);

}

CelexonAccessory.prototype.getPowerOn = function(callback) {
  var powerOn = this.binaryState > 0;
  this.log("Leinwand '%s' ist %s", this.bulbName, this.binaryState);
  
  rpio.write(this.pinStop, this.activeState);
  rpio.sleep(1);
  rpio.write(this.pinStop, rpio.LOW);
      
  rpio.write(this.pinUp, this.activeState);
  rpio.sleep(1);
  rpio.write(this.pinUp, rpio.LOW);
  
  callback(null, powerOn);
}

CelexonAccessory.prototype.setPowerOn = function(powerOn, callback) {
  this.binaryState = powerOn ? 1 : 0; 
  this.log("Leinwand '%s' ist %s", this.bulbName, this.binaryState);
  
  rpio.write(this.pinDown, this.activeState);
  rpio.sleep(this.durationDown);
  rpio.write(this.pinDown, rpio.LOW);
  
  rpio.write(this.pinStop, this.activeState);
  rpio.sleep(1);
  rpio.write(this.pinStop, rpio.LOW);

  callback(null);
}

CelexonAccessory.prototype.getServices = function() {
    var lightbulbService = new Service.Lightbulb(this.name);
    
    lightbulbService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerOn.bind(this))
      .on('set', this.setPowerOn.bind(this));
    
    return [lightbulbService];
}


