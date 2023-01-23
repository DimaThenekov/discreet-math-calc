import { Byte, Bit } from "./byte";
import { Mantissa } from "./mantissa";


class FloatRegister /* implements IRegister */ {
  private _characteristicAndSign: Byte = new Byte(0);

  get sign(): Bit {
    return this._characteristicAndSign.sign
  }

  get characteristic(): number {
    return this._characteristicAndSign.sliceNumber(1)
  }

  constructor(public mantissa: Mantissa, exponent: number, sign: Bit = 0) {
    
    this.characteristic = exponent;
    this.sign = sign
  }

  private set characteristic(exponent: number) {
    const sign = this.sign
    const characteristic = new Byte(exponent + 64)
    characteristic.sign = sign
    this._characteristicAndSign = characteristic
  }

  private set sign(sign: Bit) {
    this._characteristicAndSign.sign = sign
  }

  static add(a: FloatRegister, b: FloatRegister) {
    const difference = a.characteristic - b.characteristic
    console.log(`difference is ${difference} = ${a.characteristic} - ${b.characteristic}`)

    if (difference < 0)  {
      console.log("below zero")
      for (let i = 0; i < Math.abs(difference); i++) {
        a.mantissa.shiftRight()
      }
    } else {
      console.log("equal or above zero")
      for (let i = 0; i < difference; i++) {
        b.mantissa.shiftRight()
      }
    }

    if (a.sign == b.sign) {
      a.mantissa.add(b.mantissa)
    } else {
      const carryOut = a.mantissa.subtract(b.mantissa)
      a.sign = carryOut;
    }

    const correction = a.mantissa.normalize()
    a.characteristic = a.characteristic - correction

  }
}
// 0xf05
// 0x005

const a = new FloatRegister(new Mantissa(0x105), 2)
const b = new FloatRegister(new Mantissa(0x724), 1)

FloatRegister.add(a, b)

console.log(a.mantissa.number.toString(16), a.characteristic)



