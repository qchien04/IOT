// Types
export interface Sensors {
  temperature: number;
  humidity: number;
  gas: number;
  rainValue: number;
}

export interface Devices {
  doorOpen: boolean;
  roofOpen: boolean;
  ledPIR: boolean;
  gasBuzzer: boolean;
  ledBedRoom: boolean;
  camBuzzer: boolean;
}

export interface AutoModes {
  autoDoor: boolean;
  autoRoof: boolean;
  autoPIR: boolean;
  autoGasBuzzer: boolean;
}

export interface SystemState {
  sensors: Sensors;
  devices: Devices;
  autoModes: AutoModes;
  cameraImageUrl: string;
  roofPosition: number;
  doorPosition: number;
  connected: boolean;
}

export interface Config {
  ROOF_OPEN_CORNER: number;
  ROOF_CLOSE_CORNER: number;
  DOOR_OPEN: number;
  DOOR_CLOSE: number;
  GAS_THRESHOLD: number;
  RAIN_THRESHOLD: number;

  sendInterval : number;
  dhtInterval  : number;
  lcdInterval  : number;
  gasInterval  : number;
}
