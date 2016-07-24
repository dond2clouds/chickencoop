var http = require('http');
var util = require('util');
var m = require('mraa');
var doorOpenPin = new m.Gpio(3);
var doorClosePin = new m.Gpio(5);
var doorClosedPin = new m.Gpio(7);
var Accessory, Service, Characteristic;
var fullCycleTime = 15000;

var coopdoor;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-coopdoor", "ChickenCoopDoor", ChickenCoopDoorAccessory);

  doorOpenPin.dir(m.DIR_OUT);
  doorOpenPin.write(1);
  doorClosePin.dir(m.DIR_OUT);
  doorClosePin.write(1);
  doorClosedPin.dir(m.DIR_IN);
}


function ChickenCoopDoorAccessory(log, config) {
  coopdoor = this;
  coopdoor.log = log;
  coopdoor.name = config["name"];
  coopdoor.state = doorClosedPin.read() == 0 ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN;

  doorClosedPin.isr(m.EDGE_BOTH, monitorDoorState);  
  coopdoor.service = new Service.GarageDoorOpener(this.name);
  coopdoor.service.getCharacteristic(Characteristic.CurrentDoorState)
    .on('get', coopdoor.getState.bind(this));
  
  coopdoor.service
    .getCharacteristic(Characteristic.TargetDoorState)
    .on('get', coopdoor.getState.bind(this))
    .on('set', coopdoor.setState.bind(this));
}

ChickenCoopDoorAccessory.prototype.getState = function(callback) {
  callback(null, this.state);
}

function monitorDoorState() {
  if (coopdoor)  {
    console.log(coopdoor.state);
    console.log(coopdoor.service);
    coopdoor.state = doorClosedPin.read() == 0 ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN;
    coopdoor.service.setCharacteristic(Characteristic.CurrentDoorState, coopdoor.state);
  }
}
  
ChickenCoopDoorAccessory.prototype.setState = function(state, callback) {
  if (state == Characteristic.CurrentDoorState.OPEN) {
  	coopdoor.open(callback);  
  } else {
  	coopdoor.close(callback);  
  }
}

ChickenCoopDoorAccessory.prototype.getServices = function() {
  return [coopdoor.service];
}

ChickenCoopDoorAccessory.prototype.open = function(callback) {
  var self = this;
  doorOpenPin.write(0);
  setTimeout(function() {
    doorOpenPin.write(1);
    callback(null);
  }, fullCycleTime);
}

ChickenCoopDoorAccessory.prototype.close = function(callback) {
  var self = this;
  doorClosePin.write(0);
  setTimeout(function() {
    doorClosePin.write(1);
    callback(null);
  }, fullCycleTime);
}
