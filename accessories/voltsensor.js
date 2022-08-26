"use strict";
const EvePower = require('./CustomCharacteristic');
const EvePowerMonitoringService = EvePower.PowerMonitorService;
const EveVoltage = EvePower.Voltage;

class voltageGuageSensor {
    constructor(bt, device, config, log, Service, Characteristic, UUIDGen, Homebridge) {
    this.Characteristic = Characteristic;
    this.Service = Service;
    this.name = device.name;
    this.id = device.deviceId.toString();
    this.log = log;
    this.devicevoltage = device.voltage; 
    this.soc = device.soc;
    this.uuid = UUIDGen.generate(this.id);
    this.bt = bt;
    this.bt.on(this.id, this.refreshState.bind(this));
    this.powerMonitor = EvePowerMonitoringService(Homebridge);
    this.voltage = EveVoltage(Homebridge);
    // Create voltage characteristic for easy reference
    this.Characteristic = Object.defineProperty(Homebridge.hap.Characteristic, 'volt', {value: this.voltage});
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
        .setCharacteristic(this.Characteristic.SerialNumber, this.id);
    
    var outletService = this.accessory.getService(this.Service.Outlet);
    if(outletService == undefined) outletService = this.accessory.addService(this.Service.Outlet,this.name); 
    outletService.setCharacteristic(this.Characteristic.Name, this.name); 
    outletService.getCharacteristic(this.Characteristic.On)
          .on("get",  async callback => this.getPowerState(callback));
			
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

  // Handle requests to get the current value of the "Current Ambient Light Level" characteristic
  async getPowerState(callback) {
    // set this to a valid value for On
    const currentValue = 0;
    return callback(null, currentValue);
  }
  // Handle requests to get the current value of the "Status Low Battery" characteristic
   
  async getStatusLowBattery(callback) {
    // set this to a valid value for StatusLowBattery
    var currentValue = this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    if (this.soc < 20) currentValue = this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
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
    this.log.debug('getVolt: Voltage - ', this.devicevoltag);
    // set this to current battery level
    const currentValue =  this.devicevoltage;
    return callback(null, currentValue);
  }
  
}
module.exports = voltageGuageSensor;