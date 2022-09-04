[![NPM Version](https://img.shields.io/npm/v/homebridge-batterytender.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-batterytender)


<p align="center">
<img src="https://www.batterytender.com/Battery%20Tender%20Website%20Images/081-0172.BatteryTender.07.Lifestyle1.jpg?resizeid=12&resizeh=1000&resizew=1000" width="150">
 <img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">



</p>


# Homebridge Plug-In for Deltran Battery Monitor Tender
A Homebridge plug-in to integrate the Deltran Battery Monitor Tender (https://www.batterytender.com/battery-tender-wireless-battery-monitor_2)into Homebridge. This module exposed monitor as an outlet. With outlet change state to indicated voltage level and battery indicator for percentage of charge. This module also uses Eve Home attribute to report voltage.

## Limitation:
* This module has only been tested with Deltran Battery Tender® Wireless Battery Monitor.
* The Battery Tender Monitor only checks-in a few time a day.  This not realtime monitor, rather gives the user insight to current charge level of battery level in Homekit.



## Configuration options

| Attributes        | Description                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Email              | Email associated wtih Battery Tender. This is a required value.                    |
| password              | Battery Tender password. This is a required value.                                                                 |
| deviceRefresh        | Polling interval to obtain status of Flo devices, provide in hours. Default to each hour.          |
| batteryWarning          | Battery Tender level to indicated when battery warning icon level is display in HomeKit. Default to <i>30</i>, this is an optional value.                                
| switchAutoOn| The outlet will automated turn-on to indicate the monitored battery has drop and need to be charge.   Default to <i>11.99 volts</i>, this is an optional value.                                                        |
| switchStateReverse | Reverse the outlet on and off state. The setting will result On when battery is above monitor voltage state and Off when the value drop below voltage.  Default to <i>false</i>, this is an optional value.        
| excludedDevices         | Devices to surpress from HomeKit. This is an optional value. | |



Example configuration is below.

```javascript
...

"platforms": [
{
  "name": "BatteryTender",
  "auth": {
    "email": "<email address>",
    "password": "<password>"
  },
  "deviceRefresh": 1,
  "batteryWarning": 30,
  "switchAutoOn": "11.99",
  "switchStateReverse": false,
  "platform": "BatteryTender"
}
...
