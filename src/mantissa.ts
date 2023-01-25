import { Bit, Byte } from "./byte";
import { Register } from "./int16";

type TRawMantissaTuple = [Byte, Byte]

export type TMantissaFormat = {
  bitsUsed: number
  digitWidth: number
  hiddenOne: boolean
}

export const F1Mantissa: TMantissaFormat = {
  bitsUsed: 12,
  digitWidth: 4,
  hiddenOne: false

}

export const F2Mantissa: TMantissaFormat = {
  bitsUsed: 11,
  digitWidth: 1,
  hiddenOne: true
}

export class Mantissa {
  
  private data: Register;
  private readonly ZERO_TRAIL_WIDTH: number

  get rawNumber() {
    return this.data.number >> this.ZERO_TRAIL_WIDTH
  }

  get number() {
    if (this.FORMAT.hiddenOne) {
      const number = this.recoverHiddenOne().rawNumber
      this.shiftLeft(true)
      return number
    }

    return this.rawNumber
  }

  get raw() {
    return this.data.formattedBin
  }

  constructor(number: number, public readonly FORMAT: TMantissaFormat = F1Mantissa) {
    this.ZERO_TRAIL_WIDTH = Register.WIDTH - this.FORMAT.bitsUsed

    const overflowedDigit = Mantissa.getDigit(number, Mantissa.computeAmountOfDigits(FORMAT), FORMAT)
    let toStore = number

    if (!(FORMAT.hiddenOne && overflowedDigit)) {
      // normalized
      toStore = Mantissa.normalize(number, FORMAT, this.ZERO_TRAIL_WIDTH) << (FORMAT.hiddenOne ? FORMAT.digitWidth : 0)
    }

    const normalizedWithTrail = toStore << this.ZERO_TRAIL_WIDTH
    this.data = new Register(normalizedWithTrail)
    console.log("raw mantissa", this.raw)
  }

  recoverHiddenOne() {
    this.data.shiftRight(1)

    for (let i = 0; i < this.FORMAT.digitWidth - 1; i++) {
      this.data.shiftRight(0)
    }

    return this
  }

  shiftRightFill() {
    this.recoverHiddenOne()
    this.zeroTrail()

    return this
  }

  shiftRight(useExtendedBitGrid = false) {
    console.log("shifting right")

    const digitWidth = this.FORMAT.digitWidth

    // ZERO_TRAIL_WIDTH is added to zero most right digit
    for(let i = 0; i < digitWidth; i++) {
      this.data.shiftRight(0)
    }

    this.zeroTrail(useExtendedBitGrid)

    return this
  }

  shiftLeft(useExtendedBitGrid = false) {
    for (let i = 0; i < this.FORMAT.digitWidth; i++) {
      this.data.shiftLeft()
    }

    this.zeroTrail(useExtendedBitGrid)


    return this
  }

  zeroTrail(useExtendedBitGrid = false) {
    for( let i = 0; i < this.ZERO_TRAIL_WIDTH - +useExtendedBitGrid; i++) {
      this.data.shiftRight(0)
    }

    for( let i = 0; i < this.ZERO_TRAIL_WIDTH - +useExtendedBitGrid; i++) {
      this.data.shiftLeft(0)
    }

    return this
  }

  static normalize(number: number, format: TMantissaFormat, ZERO_TRAIL_WIDTH: number): number {
    const digitsAmount = Mantissa.computeAmountOfDigits(format)

    for (let i = 0; i < digitsAmount; i++) {
      if (!Mantissa.isRightDenormalized(number, format)) {
        break;
      }
      // console.log("number", number.toString(2))

      number = number << format.digitWidth
    }

    return number
  }

  static isRightDenormalized(number: number, format: TMantissaFormat) {
    const digitsAmount = Mantissa.computeAmountOfDigits(format)
    const mostSignificantDigit = digitsAmount - 1;
    return !Mantissa.getDigit(number, mostSignificantDigit, format)
  }

  static computeAmountOfDigits(format: TMantissaFormat) {
    return format.bitsUsed / format.digitWidth
  }

  /** operates on numbers without trail */
  private static getDigit(number: number, index: number, format: TMantissaFormat) {
    const mask = parseInt("1".repeat(format.digitWidth), 2) << (format.digitWidth * index)
    return number & mask
  }

  normalize(): number {
    let count = 0
    const digitsAmount = Mantissa.computeAmountOfDigits(this.FORMAT)
    console.log("normalizing")
    for (let i = 0; i < digitsAmount; i++) {
      if (!Mantissa.isRightDenormalized(this.rawNumber, this.FORMAT)) {
        break
      }
      this.shiftLeft()
      count++
    }

    console.log("count", count)

    return count
   }

  add(mantissa: Mantissa): Bit {
    return this.data.add(mantissa.data)
  }

  subtract(mantissa: Mantissa): Bit {
    console.log(`subtracting ${this.raw} - ${mantissa.raw}`)
    const carryOut = this.data.subtract(mantissa.data)
    console.log("mantissa right after subtraction", this.raw)
    
    if (carryOut) {
      this.data = new Register(Math.abs(this.data.numberSigned))
    }

    return carryOut
  }
}

// const a = new Mantissa(0xf05)
// const b = new Mantissa(0x5)
// const f = new Mantissa(0b0110, F2Mantissa)
// const x = new Mantissa(0b1, F2Mantissa)
// const y = new Mantissa(0b10001, F2Mantissa)
// const long = new Mantissa(0b1011_1111_1111, F2Mantissa)
// console.log(long.raw)

// console.log(a.raw)
// console.log(b.raw)
// console.log(f.raw)
// console.log(x.raw)
// console.log(y.raw)

