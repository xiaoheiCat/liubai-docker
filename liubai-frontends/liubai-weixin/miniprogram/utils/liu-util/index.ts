import { handleCharacteristic, handleDeviceString } from "./tools/characteristic";


export class LiuUtil {

  static getCharacteristic() {
    return handleCharacteristic()
  }

  static getDeviceString() {
    return handleDeviceString()
  }

}