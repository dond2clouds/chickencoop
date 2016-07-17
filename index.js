var http = require('http');
var m = require('mraa');
var doorOpenPin = new m.Gpio(3);
var doorClosePin = new m.Gpio(5);
var Accessory, Service, Characteristic, UUIDGen;
var fullCycleTime = 30000;

module.exports = function(homebridge) {
  console.log("homebridge API version: " + homebridge.version);

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
  this.doorOpen = false; // Closed.
  
  this.service = new Service.GarageDoorOpener(this.name);

  this.service.getCharacteristic(Characteristic.CurrentDoorState)
    .on('get', this.getState.bind(this));
  
  this.service
    .getCharacteristic(Characteristic.TargetDoorState)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
}

ChickenCoopDoorAccessory.prototype.getState = function(callback) {
  callback(null, this.doorOpen ? Characteristic.CurrentDoorState.OPEN : Characteristic.CurrentDoorState.CLOSED );
}
  
ChickenCoopDoorAccessory.prototype.setState = function(state, callback) {
  var open = state == Characteristic.CurrentDoorState.OPEN ? true : false;
  if (open) {
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
  self.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
  setTimeout(function() {
    doorOpenPin.write(1);
    self.doorOpen = true;
    self.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
    callback(null);
  }, fullCycleTime);
}

ChickenCoopDoorAccessory.prototype.close = function(callback) {
  var self = this;
  doorClosePin.write(0);
  self.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
  setTimeout(function() {
    doorClosePin.write(1);
    self.doorOpen = false;
    self.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
    callback(null);
  }, fullCycleTime);
}
