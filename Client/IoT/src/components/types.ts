export interface Sensors {
  temperature: number;
  humidity: number;
  gas: number;
}

export interface Devices {
  fan: boolean;
  doorOpen: boolean;
  awningOpen: boolean;
}

export interface DashboardState {
  sensors: Sensors;
  devices: Devices;
  gasDetected: boolean;
  gasAlert: boolean;
  cameraImageUrl: string;
  connected: boolean;
}
