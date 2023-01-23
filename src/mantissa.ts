import { Bit, Byte } from "./byte";

type TRawMantissaTuple = [Byte, Byte]

export class Mantissa {
  static readonly HALF_BYTES_USED = 3

  highByte: Byte
  lowByte: Byte

  get number() {
    return (this.highByte.number << 4) + this.lowByte.highHalfToByte.number
  }

  constructor(number: number) {
    const raw = Mantissa.parseHexDigits(Mantissa.normalize(number))
    console.log(raw[0].bin, raw[1].bin)
    this.highByte = raw[0]
    this.lowByte = raw[1]
  }

  shiftRight() {
    const lowHalf = this.highByte.lowHalfToByte
    this.highByte = this.highByte.highHalfToByte
    this.lowByte = lowHalf.swap()
    return this
  }

  shiftLeft() {
    const lowHalf = this.highByte.lowHalf
    this.highByte = new Byte((lowHalf << 4) | this.lowByte.highHalfToByte.number)
    this.lowByte = new Byte(0)

    return this
  }

  private static parseHexDigits(number: number): TRawMantissaTuple {
    const mantissaBytes: Byte[] = []
    const mask = 0xf

    for (let i = 0; i < Mantissa.HALF_BYTES_USED; i++) {
      const mantissaShifted = number >> (4*i)

      const digit = mantissaShifted & mask

      const isEven = i % 2 == 0
      const byteContent = digit << (4 * +isEven)
      const currentByte = isEven ? mantissaBytes.shift() : null

      const bytePrepared = new Byte(byteContent | (currentByte?.number ?? 0))
      mantissaBytes.unshift(bytePrepared)
    }

    return mantissaBytes as TRawMantissaTuple
  }

  static normalize(number: number): number {
    const mask = 0xf00
    for (let i = 0; i < Mantissa.HALF_BYTES_USED; i++) {
      if (number & mask) {
        break;
      }

      number = number << 4
    }

    return number
  }

  isRightDenormalized() {
    return this.number != Mantissa.normalize(this.number)
  }

  normalize(): number {
    let count = 0

    while (this.isRightDenormalized()) {
      console.log(this.highByte.bin, this.lowByte.bin, this.number)
      this.shiftLeft()
      count++
    }

    return count
   }

  add(mantissa: Mantissa): Bit {
    const [carryIn, lowByte] = this.lowByte.add(mantissa.lowByte);
    const [carryOut, highByte] = this.highByte.add(mantissa.highByte, carryIn)


    this.lowByte = lowByte
    this.highByte = highByte

    return carryOut
  }

  subtract(mantissa: Mantissa): Bit {
    const [carryIn, lowByte] = this.lowByte.subtract(mantissa.lowByte);
    const [carryOut, highByte] = this.highByte.subtract(mantissa.highByte, carryIn)
    
    if (carryOut) {
      this.lowByte = lowByte.absoluteToByte
      this.highByte = highByte.absoluteToByte
    } else {
      this.lowByte = lowByte
      this.highByte = highByte
    }

    return carryOut
  }
}
