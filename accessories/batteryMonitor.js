"use strict";
const EvePower = require('./CustomCharacteristic');
const EvePowerMonitoringService = EvePower.PowerMonitorService;
const EveVoltage = EvePower.Voltage;

class batteryMonitor {
    constructor(bt, device, config, log, Service, Characteristic, UUIDGen, Homebridge) {
    this.Characteristic = Characteristic;
    this.Service = Service;
    this.name = device.name;
    this.deviceid = device.deviceId.toString();
    this.log = log;
    this.devicevoltage = device.voltage; 
    this.soc = device.soc;
    this.uuid = UUIDGen.generate(this.deviceid);
    this.LowBatteryLevel = config.batteryWarning || 30;
    this.plugOnState = parseFloat(config.switchAutoOn).toFixed(2) || 11.99;
    this.plugOnStateReverse = config.switchStateReverse || false;
    this.powerMonitor = EvePowerMonitoringService(Homebridge);
    this.voltage = EveVoltage(Homebridge);
    // Create voltage characteristic for easy reference
    this.Characteristic = Object.defineProperty(Homebridge.hap.Characteristic, 'volt', {value: this.voltage});
    // Register device for updates
    this.bt = bt;
    this.bt.on(this.deviceid, this.refreshState.bind(this));
  }

  refreshState(eventData)
  {
    this.log.debug(`Device updated requested: ` , eventData);
    this.devicevoltage = eventData.device.voltage|| 1;
    this.soc = eventData.device.soc || 0;
  }

  setAccessory(accessory) {
    this.accessory = accessory;
    this.accessory.getService(this.Service.AccessoryInformation)
        .setCharacteristic(this.Characteristic.Manufacturer, 'Deltan')
        .setCharacteristic(this.Characteristic.Model, 'Battery Tender')
        .setCharacteristic(this.Characteristic.SerialNumber, this.deviceid);
    
    var outletService = this.accessory.getService(this.Service.Outlet);
    if(outletService == undefined) outletService = this.accessory.addService(this.Service.Outlet,this.name); 
    outletService.setCharacteristic(this.Characteristic.Name, this.name); 
    outletService.getCharacteristic(this.Characteristic.On)
          .on("get",  async callback => this.getPowerState(callback))
          .on('set', async (state, callback) => this.setPowerState(state, callback));   
			
    var powerMeterService = this.accessory.getService(this.powerMonitor);
    if (powerMeterService == undefined) {
        powerMeterService = this.accessory.addService(this.powerMonitor, "Power Levels"); 
        outletService.addLinkedService(powerMeterService);
        this.accessory.context.powerMeterService = powerMeterService;
    }
    powerMeterService.getCharacteristic(this.Characteristic.volt) 
       .on("get",  async callback => this.getVolt(callback));

    
    var batteryService = this.accessory.getService(this.Service.Battery);
    if(batteryService == undefined) {
      batteryService = this.accessory.addService(this.Service.Battery, "Battery Level"); 
      outletService.addLinkedService(batteryService);
    }
    // create handlers for required characteristics
    batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
      .on('get', async callback => this.getStatusLowBattery(callback));
    batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
      .on('get', async callback => this.getBatteryLevel(callback));


  }

  // Handle requests to set and get the current value of the for outlet
  async setPowerState(value,callback){
    var currentValue =false;
    // set power status based  on threshold set within configuration file
    if (this.devicevoltage < this.plugOnState) currentValue = true;
    if (this.plugOnStateReverse) currentValue = !currentValue;

    // Get the button service and updated outlet soon after set function is complete 
    var outletService = this.accessory.getService(this.Service.Outlet);
    setTimeout(function () {outletService.updateCharacteristic(this.Characteristic.On,currentValue)}.bind(this),1000);
    return callback(null);
  }
  async getPowerState(callback) {
    var currentValue =false;
    // set power status based  on threshold set within configuration file
    if (this.devicevoltage < this.plugOnState) currentValue = true;
    if (this.plugOnStateReverse) currentValue = !currentValue;
    return callback(null, currentValue);
  }

  // Handle requests to get the current value of the "Status Low Battery" characteristic
  async getStatusLowBattery(callback) {
  
    var currentValue = this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    // set power status based  on threshold set within configuration file
    if (this.soc < this.plugsOnState) currentValue = 1;
    if (this.soc < this.LowBatteryLevel) currentValue = this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
    this.log.debug('getStatusLowBattery  StatusLowBattery - ', currentValue);
    return callback(null, currentValue);
  }
  async getBatteryLevel(callback) {
    this.log.debug('getBatteryLevel: BatteryLevel - ', this.soc);
    // set this to current battery level
    const currentValue =  this.soc
    return callback(null, currentValue);
  }

  async getVolt(callback) {
    this.log.debug('getVolt: Voltage - ', this.devicevoltage);
    // set this to current battery level
    // Post the voltage as extended attribute in Homekit (this value maybe rounded to closest whole number)
    const currentValue =  this.devicevoltage;
    return callback(null, currentValue);
  }
  
}
module.exports = batteryMonitor;