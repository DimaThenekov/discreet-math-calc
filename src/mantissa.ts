import { Bit, Byte } from "./byte";
import { Register } from "./int16";

type TRawMantissaTuple = [Byte, Byte]

export type TMantissaFormat = {
  bitsUsed: number
  digitWidth: number
}

export const F1Mantissa: TMantissaFormat = {
  bitsUsed: 12,
  digitWidth: 4
}

export const F2Mantissa: TMantissaFormat = {
  bitsUsed: 11,
  digitWidth: 1
}

export class Mantissa {
  
  private data: Register;
  private readonly ZERO_TRAIL_WIDTH: number

  get number() {
    return this.data.number >> this.ZERO_TRAIL_WIDTH
  }

  get raw() {
    return this.data.formattedBin
  }

  constructor(number: number, public readonly FORMAT: TMantissaFormat = F1Mantissa) {
    this.ZERO_TRAIL_WIDTH = Register.WIDTH - this.FORMAT.bitsUsed
    const normalized = Mantissa.normalize(number, FORMAT) << this.ZERO_TRAIL_WIDTH
    this.data = new Register(normalized)
  }

  shiftRight(fill = 0) {
    console.log("shifting right")

    const digitWidth = this.FORMAT.digitWidth
    // ZERO_TRAIL_WIDTH is added to zero most right digit
    for(let i = 0; i < digitWidth + this.ZERO_TRAIL_WIDTH; i++) {
      this.data.shiftRight(0)
    }

    for (let i = 0; i < this.ZERO_TRAIL_WIDTH; i++) {
      this.data.shiftLeft()
    }

    return this
  }

  shiftLeft() {
    for (let i = 0; i < this.FORMAT.digitWidth; i++) {
      this.data.shiftLeft()
    }

    return this
  }

  static normalize(number: number, format: TMantissaFormat): number {
    const digitsAmount = (format.bitsUsed / format.digitWidth) - 1
    const mask = parseInt("1".repeat(format.digitWidth), 2) << (format.digitWidth * (digitsAmount))

    for (let i = 0; i < digitsAmount; i++) {
      if (number & mask) {
        break;
      }
      // console.log("number", number.toString(2))

      number = number << format.digitWidth
    }

    return number
  }

  isRightDenormalized() {
    return this.number != Mantissa.normalize(this.number, this.FORMAT)
  }

  normalize(): number {
    let count = 0
    console.log("normalizing")
    while (this.isRightDenormalized()) {
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
    console.log(`subtracting ${this.data.number.toString(16)} - ${mantissa.data.number.toString(16)}`)
    const carryOut = this.data.subtract(mantissa.data)
    console.log("mantissa right after subtraction", this.number.toString(16))
    
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

// console.log(a.raw)
// console.log(b.raw)
// console.log(f.raw)
// console.log(x.raw)

