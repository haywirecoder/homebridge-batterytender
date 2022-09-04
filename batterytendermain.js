
const EventEmitter = require('events');
const needle = require('needle');

// URL constant for retrieving data

const HOST = 'https://balanced.deltranconnected.com'
const LOGIN_PATH = '/api/users/login'
const AUTHENTICATE_PATH = '/api/users/authenticate'
const CHARGER_PATH = '/api/charger/status'
const MONITOR_PATH = '/api/monitor/status'

class BatteryTender extends EventEmitter {
    auth_token = {};
    batteryTenderDevicesMonitors = [];
    excludedDevices = []
    log;
    deviceRefreshHandle;
    deviceRefreshTime;
    debug;


    constructor(log, config) {
        super();
        this.log = log;
        this.deviceRefreshHandle = null;
        this.deviceRefreshTime = config.deviceRefresh * 3600000 || 3600000;
        this.excludedDevices = config.excludedDevices || [];
        this.auth_token.email = config.auth.email;
        this.auth_token.password = config.auth.password;
        this.auth_token.token ="";
    };

    // Initial login and building of device list 
    async init() {

        this.log.info("Battery Tender Login...");
        var url = HOST + LOGIN_PATH;
        
        try {
            const response = await needle("post", url,
            {
                email: this.auth_token.email,
                password: this.auth_token.password

            });
                // this.log.info(response);
            var device_response = response;
            this.log.debug("Battery Raw Data: ", device_response.body,  "\n");
            this.auth_token.token = device_response.body.token;
            // Discovery and create device list
            for(var i in device_response.body.monitors)
            {
                if (this.excludedDevices.includes(device_response.body.monitors[i]['name'])) {
                    this.log.info(`Executing Device with name: '${device_response.body.monitors[i]['name']}'`);
                    
                } else {
                    var device = {};
                    device.deviceId = device_response.body.monitors[i]['deviceId'];
                    device.name = device_response.body.monitors[i]['name'];
                    device.lastUpdate = new Date(device_response.body.monitors[i]['statusHistory'][0]['date']);
                    device.soc = device_response.body.monitors[i]['statusHistory'][0]['soc'];
                    device.voltage = device_response.body.monitors[i]['statusHistory'][0]['voltage'];
                    this.batteryTenderDevicesMonitors.push(device);
                }

            }
            this.log.debug("Device dump: ", this.batteryTenderDevicesMonitors, "\n");
        }
        catch(err) {
            // Something went wrong, display message and return negative return code
            this.log.error("Battery Monitoring Device Login Error: ", err.message);
            return false;
        } 
    }

    // Start for periodic refresh of devices
    startPollingProcess()
    {
        // Set time to refresh devices
       this.deviceRefreshHandle = setTimeout(() => this.backgroundRefresh(), this.deviceRefreshTime); 
     
    };

    async backgroundRefresh() {

        this.log.debug("Battery Monitor Device Refresh...");
        var url = HOST + MONITOR_PATH;
        if (this.deviceRefreshHandle) 
        {
            clearTimeout(this.deviceRefreshHandle);
            this.deviceRefreshHandle = null;
        }
        try {
            const response = await needle("get", url,
            {
                token: this.auth_token.token

            });
            var device_response = response;
            this.log.debug("Battery Raw Data: ", device_response.body,  "\n");
            var deviceUpdateDate;
            for(var i in device_response.body.monitors)
            {
                // find device and determine if it needs to be updated.
                var findIndex = this.batteryTenderDevicesMonitors.findIndex(device => device.deviceId === device_response.body.monitors[i]['deviceId']);
                
                if (findIndex > -1)
                { 
                    this.log.debug(`Found device at index: ${findIndex}`);
                    deviceUpdateDate = new Date(device_response.body.monitors[i]['statusHistory'][0]['date']+30);
                    if (this.batteryTenderDevicesMonitors[findIndex].lastUpdate.getTime() != deviceUpdateDate.getTime())
                    {
                        this.batteryTenderDevicesMonitors[findIndex].lastUpdate = new Date(device_response.body.monitors[i]['statusHistory'][0]['date']);
                        this.batteryTenderDevicesMonitors[findIndex].voltage = device_response.body.monitors[i]['statusHistory'][0]['voltage'];
                        this.batteryTenderDevicesMonitors[findIndex].soc = device_response.body.monitors[i]['statusHistory'][0]['soc'];
                        // Device data has changed, emit and event to process 
                        this.log.debug("Battery Device Update Triggered: ", this.batteryTenderDevicesMonitors[findIndex]);
                        this.emit(this.batteryTenderDevicesMonitors[findIndex].deviceid, {
                            device: this.batteryTenderDevicesMonitors[findIndex]
                        });
                   }
                } else this.log.debug(`Device not found: ${device_response.body.monitors[i]['deviceId']}`);
            }
            
        }
        catch(err) {
            // Something went wrong, display message and return negative return code
            this.log.error("Battery Monitoring Device Refresh Error: ", err.message);
        };
        // set for next polling interval
        this.deviceRefreshHandle = setTimeout(() => this.backgroundRefresh(), this.deviceRefreshTime); 
    }
}

module.exports = BatteryTender;