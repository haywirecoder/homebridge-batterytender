"use strict";
const btengine = require('./batterytendermain');
const voltageguage = require('./accessories/voltsensor');

const PLUGIN_NAME = 'homebridge-batterytender';
const PLATFORM_NAME = 'BatteryTender';


var Service, Characteristic, HomebridgeAPI, UUIDGen;

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  UUIDGen = homebridge.hap.uuid;
  homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, BatteryTenderPlatform);
}

class BatteryTenderPlatform {
  constructor(log, config, api) {
  this.log = log;
  this.api = api;
  this.name = config.name;
  this.config = config;
  this.accessories = [];
  
  // Check if authentication information has been provided.
  try{
    if ((this.config.auth.email == "") || (this.config.auth.password == "") || (!this.config.auth.password) || (!this.config.auth.email))
    {
      this.log.error('Plug-in configuration error: BatteryTender authentication information not provided.');
      // terminate plug-in initization
      return;
    }
  }
  catch(err) {
    this.log.error('Plug-in configuration error: BatteryTender authentication information not provided.');
    // terminate plug-in initization
    return;
  }
  
  this.bt = new btengine (log, this.config);
 
  // When this event is fired it means Homebridge has restored all cached accessories from disk.
  // Dynamic Platform plugins should only register new accessories after this event was fired,
  // in order to ensure they weren't added to homebridge already. This event can also be used
  // to start discovery of new accessories.
  api.on('didFinishLaunching', () => {

    this.initialLoad =  this.bt.init().then (() => {
       this.log.debug('Initialization Successful.');
       // Once devices are discovered update Homekit assessories
       this.refreshAccessories();
    }).catch(err => {
      this.log.error('BatterTender Initization Failure:', err);
      // terminate plug-in initization
      return;
    });
    
  });
  }
   // Create associates in Homekit based on devices in BatteryTender account
  async refreshAccessories() {
  
    // Process each flo devices and create accessories within the platform.
    this.log.info("Loading Devices...");
    for (var i = 0; i < this.bt.batteryTenderDevicesMonitors.length; i++) {

      let currentDevice = this.bt.batteryTenderDevicesMonitors[i];
      this.log(`Configuring ${currentDevice.name} with Device ID: ${currentDevice.deviceId} `)
      var sensorAccessory = new voltageguage(this.bt, currentDevice, this.config, this.log, Service, Characteristic, UUIDGen, HomebridgeAPI);
      // check the accessory was not restored from cache
      var foundAccessory = this.accessories.find(accessory => accessory.UUID === sensorAccessory.uuid)
      if (!foundAccessory) {
        // create a new accessory
        let newAccessory = new this.api.platformAccessory(sensorAccessory.name, sensorAccessory.uuid);
        // add services and Characteristic
        sensorAccessory.setAccessory(newAccessory);
        // register the accessory
        this.addAccessory(sensorAccessory);
      }
      else // accessory already exist just set characteristic
        sensorAccessory.setAccessory(foundAccessory);
    }
    this.log.info(`Monitoring Devices configured: ${this.bt.batteryTenderDevicesMonitors.length}`);

     // Clean accessories with no association with Flo devices.
     this.orphanAccessory();
     // Start background process to poll devices.
     this.bt.startPollingProcess();
  };

// Find accessory with no association with battery monitoring device and remove
async orphanAccessory() {
  var cachedAccessory = this.accessories;
  var foundAccessory;

  for (var i = 0; i < cachedAccessory.length; i++) 
  {   
    let accessory = cachedAccessory[i];
    // determine if accessory is currently a device in flo system, thus should remain
    foundAccessory = this.bt.batteryTenderDevicesMonitors.find(device => UUIDGen.generate(device.deviceId.toString()) === accessory.UUID)
    if (!foundAccessory) {
          this.removeAccessory(accessory,true);
    }
  }
}


//Add accessory to homekit dashboard
addAccessory(device) {

  this.log.info('Adding accessory');
      try {
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [device.accessory]);
        this.accessories.push(device.accessory);
      } catch (err) {
          this.log.error(`An error occurred while adding accessory: ${err}`);
      }
}

//Remove accessory to homekit dashboard
removeAccessory(accessory, updateIndex) {
  this.log.info('Removing accessory:',accessory.displayName );
    if (accessory) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    if (updateIndex) {
      if (this.accessories.indexOf(accessory) > -1) {
          this.accessories.splice(this.accessories.indexOf(accessory), 1);
    }}
  }

  // This function is invoked when homebridge restores cached accessories from disk at startup.
  // It should be used to setup event handlers for characteristics and update respective values.
  configureAccessory(accessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  } 

}
