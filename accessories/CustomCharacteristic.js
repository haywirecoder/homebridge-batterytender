//These characteristics are under custom service E863F007-079E-48FF-8F27-9C2605A29F52 and are used by Elgato accessories 
// to exchange logs with Eve.app. Note that the accessory may have to include some of the custom characteristics 
// https://gist.github.com/simont77/3f4d4330fa55b83f8ca96388d9004e7d

const WATTS = 'E863F10D-079E-48FF-8F27-9C2605A29F52';
const TOTALWATTS = 'E863F10C-079E-48FF-8F27-9C2605A29F52';
const VOLTAGE = 'E863F10A-079E-48FF-8F27-9C2605A29F52';
const AMPERE = 'E863F126-079E-48FF-8F27-9C2605A29F52';
const POWERMETER  = '00000001-0000-1777-8000-775D67EC4377';

Wattage = function (Homebridge) {
  Service = Homebridge.hap.Service;
  Characteristic = Homebridge.hap.Characteristic;

  return class EvePowerConsumption extends Characteristic {
  static UUID = WATTS;
  constructor() {
    super('Consumption', WATTS);
    this.setProps({
      format: Characteristic.Formats.UINT16,
      unit: "Watts",
      maxValue: 100000,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
    }   
  }
}

TotalConsumption = function (Homebridge) {
  Service = Homebridge.hap.Service;
  Characteristic = Homebridge.hap.Characteristic;

  return class EveTotalConsumption extends Characteristic {
    static UUID = TOTALWATTS;
    constructor() {
      super('Energy', TOTALWATTS);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000000000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
}

Voltage = function (Homebridge) {
  Service = Homebridge.hap.Service;
  Characteristic = Homebridge.hap.Characteristic;

  return class EveVoltage extends Characteristic  {
    static UUID = VOLTAGE;
    constructor() {
      super ('Volt', VOLTAGE);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Volt',
        maxValue: 1000000000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
}

Meter = function (Homebridge) {
  Service = Homebridge.hap.Service;
  Characteristic = Homebridge.hap.Characteristic;

  return class EveAmpere extends Characteristic {
    static UUID = AMPERE;
    constructor() {
      super('Ampere', AMPERE);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Ampere',
        maxValue: 1000000000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
}

PowerMonitorService = function (Homebridge) {
  Service = Homebridge.hap.Service;
  Characteristic = Homebridge.hap.Characteristic;

  return class PowerMeterService extends Service {
    static UUID  = POWERMETER;
    constructor (displayName, subtype) {
      super(displayName, POWERMETER, subtype);
      this.addCharacteristic(Voltage(Homebridge))
      this.addOptionalCharacteristic(Wattage(Homebridge));
      this.addOptionalCharacteristic(TotalConsumption(Homebridge));
      this.addOptionalCharacteristic(Meter(Homebridge));
    };
  }
}

module.exports= {PowerMonitorService,Meter,Voltage,TotalConsumption,Wattage}


