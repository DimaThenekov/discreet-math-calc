import { Byte, Bit } from "./byte";
import { IRegister, Register } from "./int16";

type TMantissa = [Byte, Byte]

class FloatRegister /* implements IRegister */ {
  private _characteristicAndSign: Byte = new Byte(0);
  // @ts-ignore
  private _mantissa: TMantissa;

  get sign(): Bit {
    return this._characteristicAndSign.sign
  }

  get characteristic(): number {
    return this._characteristicAndSign.sliceNumber(1)
  }

  constructor(mantissa: number, exponent: number, sign: Bit = 0) {
    
    const parsedDigits = FloatRegister.parseHexDigits(mantissa)
    console.log(parsedDigits)
    this.mantissa = parsedDigits

    this.characteristic = exponent;
    this.sign = sign
  }

  private set mantissa(bytes: TMantissa) {
    this._mantissa = bytes
  }

  get mantissa(): TMantissa {
    return this._mantissa.slice() as TMantissa
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

  private static parseHexDigits(number: number): TMantissa {
    const mantissaBytes: Byte[] = []
    const mask = 0xf
    const HALF_BYTES_USED = 3

    for (let i = 0; i < HALF_BYTES_USED; i++) {
      const mantissaShifted = number >> 4*(i)
      if (mantissaShifted == 0) {
        break;
      }

      const digit = mantissaShifted & mask

      const isEven = i % 2 == 0
      const byteContent = digit << (4 * +isEven)
      const currentByte = isEven ? mantissaBytes.shift() : null
      mantissaBytes.unshift(new Byte(byteContent | (currentByte?.number ?? 0)))
    }

    return mantissaBytes as TMantissa
  }

  leftShiftMantissa() {
    
  }

  static add(a: FloatRegister, b: FloatRegister) {
    const difference = a.characteristic - b.characteristic
    
   if (difference < 0) {
    a
   } 
  }
}
// 0xf05
// 0x005

new FloatRegister(0xfa5, 0)
new FloatRegister(0xf00, 0)


