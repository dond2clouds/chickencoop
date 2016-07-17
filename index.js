var http = require('http');
var m = require('mraa');
var doorOpenPin = new m.Gpio(3);
var doorClosePin = new m.Gpio(5);
var Accessory, Service, Characteristic;
var fullCycleTime = 30000;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-coopdoor", "ChickenCoopDoor", ChickenCoopDoorAccessory);

  doorOpenPin.dir(m.DIR_OUT);
  doorOpenPin.write(1);
  doorClosePin.dir(m.DIR_OUT);
  doorClosePin.write(1);
}


function ChickenCoopDoorAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.state = Characteristic.CurrentDoorState.CLOSED;
  
  this.service = new Service.GarageDoorOpener(this.name);
  this.service.getCharacteristic(Characteristic.CurrentDoorState)
    .on('get', this.getState.bind(this));
  
  this.service
    .getCharacteristic(Characteristic.TargetDoorState)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
}

ChickenCoopDoorAccessory.prototype.getState = function(callback) {
  callback(null, this.state);
}
  
ChickenCoopDoorAccessory.prototype.setState = function(state, callback) {
  if (state == Characteristic.CurrentDoorState.OPEN) {
  	this.open(callback);  
  } else {
  	this.close(callback);  
  }
}

ChickenCoopDoorAccessory.prototype.getServices = function() {
  return [this.service];
}

ChickenCoopDoorAccessory.prototype.open = function(callback) {
  var self = this;
  doorOpenPin.write(0);
  self.state = Characteristic.CurrentDoorState.OPENING;
  self.service.setCharacteristic(Characteristic.CurrentDoorState, self.state);
  setTimeout(function() {
    doorOpenPin.write(1);
    self.state = Characteristic.CurrentDoorState.OPEN;
    self.service.setCharacteristic(Characteristic.CurrentDoorState, self.state);
    callback(null);
  }, fullCycleTime);
}

ChickenCoopDoorAccessory.prototype.close = function(callback) {
  var self = this;
  doorClosePin.write(0);
  self.state = Characteristic.CurrentDoorState.CLOSING;
  self.service.setCharacteristic(Characteristic.CurrentDoorState, self.state);
  setTimeout(function() {
    doorClosePin.write(1);
    self.state = Characteristic.CurrentDoorState.CLOSED;
    self.service.setCharacteristic(Characteristic.CurrentDoorState, self.state);
    callback(null);
  }, fullCycleTime);
}
