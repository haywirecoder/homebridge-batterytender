"use strict";
const MIN_LUX_VALUE = 1.0;
const MAX_LUX_VALUE = 13.0;

class voltageGuageSensor {
    constructor(bt, device, config, log, Service, Characteristic, UUIDGen) {
    this.Characteristic = Characteristic;
    this.Service = Service;
    this.name = device.name;
    this.id = device.deviceId.toString();
    this.log = log;
    this.voltage = device.voltage; 
    this.soc = device.soc;
    this.minSensorValue = MIN_LUX_VALUE;
    this.maxSensorValue = MAX_LUX_VALUE;
    this.uuid = UUIDGen.generate(this.id);
    this.bt = bt;
    this.bt.on(this.id, this.refreshState.bind(this));
  }
  refreshState(eventData)
  {
    this.log.debug(`Device updated requested: ` , eventData);
    this.voltage = eventData.device.voltage|| 1;
    this.soc = eventData.device.soc || 0;
  }

  setAccessory(accessory) {
    this.accessory = accessory;
    this.accessory.getService(this.Service.AccessoryInformation)
        .setCharacteristic(this.Characteristic.Manufacturer, 'Deltan')
        .setCharacteristic(this.Characteristic.SerialNumber, this.id);

    var lightSensor = this.accessory.getService(this.Service.LightSensor);
    if(lightSensor == undefined) lightSensor = this.accessory.addService(this.Service.LightSensor,this.name); 
    lightSensor.setCharacteristic(this.Characteristic.Name, this.name); 
    lightSensor.getCharacteristic(this.Characteristic.CurrentAmbientLightLevel)
      .on('get', async callback => this.getSensorValue(callback))
      .setProps({
        minValue: this.minSensorValue,
        maxValue: this.maxSensorValue
      });

    var batteryService = this.accessory.getService(this.Service.Battery);
    if(batteryService == undefined) batteryService = this.accessory.addService(this.Service.Battery, "Battery Level"); 
    // create handlers for required characteristics
    batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
      .on('get', async callback => this.getStatusLowBattery(callback));
    batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
      .on('get', async callback => this.getBatteryLevel(callback));
    lightSensor.addLinkedService(batteryService);
  
  }

  // Handle requests to get the current value of the "Current Ambient Light Level" characteristic
  async getSensorValue(callback) {
    this.log.debug('Triggered GET SensorValue');
    // set this to a valid value for CurrentAmbientLightLevel
    const currentValue =  this.voltage;
    this.log.debug('Return', currentValue);
    return callback(null, currentValue);
  }
  // Handle requests to get the current value of the "Status Low Battery" characteristic
   
  async getStatusLowBattery(callback) {
    this.log.debug('Triggered GET StatusLowBattery');

    // set this to a valid value for StatusLowBattery
    var currentValue = this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    if (this.soc < 20) currentValue = this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
    this.log.debug('Return', currentValue);
    return callback(null, currentValue);
  }

  async getBatteryLevel(callback) {
    this.log.debug('Triggered GET BatteryLevel');
    // set this to current battery level
    const currentValue =  this.soc;
    this.log.debug('Return', currentValue);
    return callback(null, currentValue);
  }
}

module.exports = voltageGuageSensor;