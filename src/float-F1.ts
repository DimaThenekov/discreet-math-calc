import { Byte, Bit } from "./byte";
import { F1Mantissa, F2Mantissa, Mantissa, TMantissaFormat } from "./mantissa";

type TFormat = {
  characteristicOffset: number
  mantissa: TMantissaFormat,
}

const F1: TFormat = {
  characteristicOffset: 64,
  mantissa: F1Mantissa,
}

const F2: TFormat = {
  characteristicOffset: 128,
  mantissa: F2Mantissa,
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
    return `${this.isNegative} ${new Byte(this.characteristic).bin} ${this.mantissa.raw}`
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

  static add(aInput: FloatRegister, bInput: FloatRegister) {
    // @ts-ignore
    let a = new FloatRegister(aInput.mantissa.number, aInput.exponent, aInput.sign, aInput.FORMAT)
    // @ts-ignore
    let b = new FloatRegister(bInput.mantissa.number, bInput.exponent, bInput.sign, bInput.FORMAT)

    console.log("adding")

    if (a.FORMAT.mantissa.hiddenOne) {
      console.log("format has hidden one, shifting right")
      a.mantissa.recoverHiddenOne()
      b.mantissa.recoverHiddenOne()
      console.log("a with hidden one recovered", a.formattedBin)
      console.log("b with hidden one recovered", b.formattedBin)
    }

    const difference = a.characteristic - b.characteristic
    console.log(`exponent difference is ${difference} = ${a.characteristic} - ${b.characteristic}`)

    if (difference < 0)  {
      console.log("below zero; shifting a")
      for (let i = 0; i < Math.abs(difference); i++) {
        a.mantissa.shiftRight(a.FORMAT.mantissa.hiddenOne)
      }

      console.log("a mantissa shifted", a.mantissa.raw)
    } else {
      console.log("equal or above zero; shifting b")
      for (let i = 0; i < difference; i++) {
        b.mantissa.shiftRight(b.FORMAT.mantissa.hiddenOne)
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
      const carryOut = a.mantissa.add(b.mantissa)
      
      if (carryOut) {
        console.log("result is left denormalized")
        a.mantissa.shiftRightFillWithOne()
        a.exponent += carryOut
      }
    } else {
      console.log(`sing are different: a --- b   ${a.sign} --- ${b.sign}`)
      // if abs(a) is lower then abs(b) -> swap
      // b sign is a sign of result 
      if (a.mantissa.number < b.mantissa.number) {
        console.log("swapping")
        const tmp = b
        b = a
        a = tmp
      }
      const carryOut = a.mantissa.subtract(b.mantissa)
      // a.sign = carryOut;
      // carryOut && a.mantissa.shiftLeft()
      console.log(`result is ${carryOut ? "negative" : "positive"}`)
    }
    
    console.log("result before normalization", a.formattedBin)

    console.log("result is right denormalized")
    
    const correction = a.mantissa.normalize()
    a.characteristic = a.characteristic - correction

    console.log("result after normalization", a.formattedBin)
    if (a.FORMAT.mantissa.hiddenOne) {
      a.mantissa.shiftLeft()
      b.mantissa.shiftLeft()
      console.log("result after hidden one correction", a.formattedBin)
    }

    return a

  }
}
// 0xf05
// 0x005
// const a = new FloatRegister(0xf05, 3, 0)
// const b = new FloatRegister(0x5, 1, 1)

// const a = new FloatRegister(0x105, 5, 1, F2)
// const b = new FloatRegister(0b1110_0100_0111, 3, 0, F2)
// const a = new FloatRegister(0b1, 1, 1, F2)
// const b = new FloatRegister(0b1, 1, 0, F2)

// const a = new FloatRegister(3, 2, 1, F2)
// const b = new FloatRegister(5, 3, 1, F2)

// const a = new FloatRegister(1, 1, 0, F2)
// const b = new FloatRegister(1, 1, 0, F2)

// const a = new FloatRegister(0, 0, 0)
// const b = new FloatRegister(0x13, 0, 1)


// const result = FloatRegister.add(b, a)

// console.log(result.formattedBin)

