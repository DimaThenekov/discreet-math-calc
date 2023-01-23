import { Byte, Bit } from "./byte";
import { F1Mantissa, F2Mantissa, Mantissa, TMantissaFormat } from "./mantissa";

type TFormat = {
  characteristicOffset: number
  mantissa: TMantissaFormat,
  hiddenOne: boolean
}

const F1: TFormat = {
  characteristicOffset: 64,
  mantissa: F1Mantissa,
  hiddenOne: false
}

const F2: TFormat = {
  characteristicOffset: 128,
  mantissa: F2Mantissa,
  hiddenOne: true
}

class FloatRegister /* implements IRegister */ {
  // @ts-ignore
  private isNegative: Bit // 1 means negative
  // @ts-ignore
  private characteristic: number
  
  public mantissa: Mantissa

  get sign(): Bit {
    return this.isNegative
  }

  get exponent(): number {
    return this.characteristic - this.FORMAT.characteristicOffset
  }

  get formattedBin() {
    return `${this.isNegative} ${new Byte(this.characteristic).bin} ${this.mantissa.number.toString(2)}`
  }

  constructor(mantissa: number, exponent: number, sign: Bit = 0, public FORMAT: TFormat = F1) {
    this.mantissa = new Mantissa(mantissa, this.FORMAT.mantissa)
    this.exponent = exponent;
    this.sign = sign
  }

  private set exponent(exponent: number) {
    this.characteristic = exponent + this.FORMAT.characteristicOffset
  }

  private set sign(sign: Bit) {
    this.isNegative = sign
  }

  static add(a: FloatRegister, b: FloatRegister) {
    console.log("adding")
    const difference = a.characteristic - b.characteristic
    console.log(`exponent difference is ${difference} = ${a.characteristic} - ${b.characteristic}`)

    if (difference < 0)  {
      console.log("below zero; shifting a")
      for (let i = 0; i < Math.abs(difference); i++) {
        a.mantissa.shiftRight(+a.FORMAT.hiddenOne)
      }

      console.log("a mantissa shifted", a.mantissa.raw)
    } else {
      console.log("equal or above zero; shifting b")
      for (let i = 0; i < difference; i++) {
        b.mantissa.shiftRight()
      }

      console.log("b mantissa shifted", b.mantissa.raw)
    }

    console.log()
    console.log("performing addition")
    console.log()

    console.log("a mantissa    ", a.mantissa.raw)
    console.log("b mantissa    ", b.mantissa.raw)
 
    if (a.sign == b.sign) {
      console.log(`sing are equal: a --- b   ${a.sign} --- ${b.sign}`)
      a.mantissa.add(b.mantissa)
    } else {
      console.log(`sing are different: a --- b   ${a.sign} --- ${b.sign}`)
      const carryOut = a.mantissa.subtract(b.mantissa)
      a.sign = carryOut;
      console.log(`result is ${carryOut ? "negative" : "positive"}`)
    }

    console.log("result before normalization", a.formattedBin)
    const correction = a.mantissa.normalize()
    a.characteristic = a.characteristic - correction
    console.log("result after normalization", a.formattedBin)


  }
}
// 0xf05
// 0x005

const a = new FloatRegister(0b0110, 0, 0, F2)
const b = new FloatRegister(0b1, 0, 0, F2)
// const a = new FloatRegister(0b1, 0, 0, F2)
// const b = new FloatRegister(0b1, 1, 0, F2)


FloatRegister.add(a, b)

console.log(a.formattedBin)




