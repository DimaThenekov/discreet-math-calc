import {Byte, Bit} from "./byte";

enum EAction {
  SHIFT,
  ADD_SHIFT,
}

enum EMethod {
  WITH_CORRECTION,
  BUTE_METHOD,
}

export interface IRegister {
  formattedBin: string,
  number: number,
  numberSigned: number
}

export class Register implements IRegister {
  //@ts-ignore
  private lowByte: Byte;
  //@ts-ignore
  private highByte: Byte;

  static WIDTH = Byte.LENGTH * 2

  constructor(initialContent: number | string) {
    this.data = initialContent;
  }

  get sign() {
    return this.highByte.sign
  }

  get number() {
    return (this.highByte.number << Byte.LENGTH) + this.lowByte.number;
  }

  get numberSigned() {
    if (this.sign) {
      return -(2 ** 16 - this.number);
    }

    return this.number;
  }

  get width() {
    return Register.WIDTH
  }

  get formattedBin() {
    if (this.highByte.number != 0) {
      return this.highByte.bin + " " + this.lowByte.bin;
    }

    return this.lowByte.bin;
  }

  shiftLeft(fill: Bit = 0) {
    const shiftedFromLow = this.lowByte.shiftLeft(fill)
    return this.highByte.shiftLeft(shiftedFromLow)
  }

  shiftRight(fill: Bit = this.sign) {
    const shiftedFromHigh = this.highByte.shiftRight(fill);
    return this.lowByte.shiftRight(shiftedFromHigh);
  }

  shiftRightArithmetic() {
    const shiftedFromHigh = this.highByte.shiftRightArithmetic()
    return this.lowByte.shiftRight(shiftedFromHigh)
  }

  add(reg: Register) {
    const [carryOutIntermediate, lowByte] = this.lowByte.add(reg.lowByte);
    const [carryOut, highByte] = this.highByte.add(reg.highByte, carryOutIntermediate);

    this.lowByte = lowByte;
    this.highByte = highByte;

    return carryOut
  }

  addHigh(byte: Byte) {
    const [_, highByte] = this.highByte.add(byte)
    this.highByte = highByte
  }

  subtract(reg: Register) {
    const [carryOutIntermediate, lowByte] = this.lowByte.subtract(reg.lowByte);
    const [carryOut, highByte] = this.highByte.subtract(reg.highByte, carryOutIntermediate)
    
    this.lowByte = lowByte
    this.highByte = highByte
    return carryOut
  }

  subtractHigh(byte: Byte) {
    const [_, highByte] = this.highByte.subtract(byte, 0)
    this.highByte = highByte
  }

  set data(data: number | string) {
    switch (typeof data) {
      case "string":
        data = parseInt(data, 2);

      case "number":
        this.lowByte = new Byte(data & 0xff);
        this.highByte = new Byte((data >> 8) & 0xff);
        break;

      default:
        console.assert(false, "default case fired!");
        break;
    }
  }

  static multiply(
    a: Register,
    b: Register,
    method: EMethod = EMethod.WITH_CORRECTION
  ) {
    console.log(`multiplicand ${a.formattedBin}`);
    console.log(`multiplier   ${b.formattedBin}`);
    console.log(`using ${method}`)
    console.log("---starting multiplication----");

    switch (method) {
      case EMethod.WITH_CORRECTION:
        return Register.multiplyWithCorrection(a, b);

      case EMethod.BUTE_METHOD:
        return Register.multiplyBute(a, b);
    }
  }

  private static multiplyWithCorrection(a: Register, b: Register) {
    const result = new Register(0);

    for (let i = 0; i < Byte.LENGTH; i++) {
      console.log(`--------------${i + 1}--------------`);

      if (b.shiftRight(0) == EAction.SHIFT) {
        console.log("shifting");
        console.log(`result reg before shifting: ${result.formattedBin}`);

        result.shiftRight();

        console.log(`result reg shifted ${result.formattedBin}`);
      } else {
        console.log("adding and shifting");

        result.highByte = result.highByte.add(a.lowByte)[1];
        console.log(
          `addition result ${result.formattedBin}; num: ${result.number}`
        );

        result.shiftRight(a.sign);
      }

      console.log(
        `intermediate result ${result.formattedBin}; num ${result.number}`
      );
    }

    if (b.lowByte.sign) {
      Register.correction(result, a);
    }

    return result;
  }

  private static multiplyBute(a: Register, b: Register): Register {
    
    const result = new Register(0)
    
    let lastShift: Bit = 0

    for (let i = 0; i < Byte.LENGTH; i++ ) {
      console.log(`--------------${i + 1}--------------`);
      // 1 -> 0  +++ shift
      // 0 -> 1  --- shift
      // if does not changed: shift
      const currentShift = b.shiftRight()
      if (lastShift != currentShift) {
        console.log(`shifted bits are different: lastShift ${lastShift}; currentShift ${currentShift}`)
        if (lastShift) {
          console.log("adding")
          result.highByte = result.highByte.add(a.lowByte)[1]
          console.log(`addition result ${result.formattedBin}; num: ${result.number}`)
        } else {
          console.log("subtracting")
          result.subtractHigh(a.lowByte)
          console.log(`subtraction result ${result.formattedBin}; num: ${result.number}`)
        }
      }

      console.log("shifting")
      result.shiftRight()
      
      lastShift = currentShift
      
      Register.printBeauty(result, "intermediate result")
    }

    return result
  }

  private static correction(result: Register, multiplicand: Register) {
    console.log(
      `performing correction on ${result.highByte.bin} by ${multiplicand.lowByte.bin} ${multiplicand.lowByte.number}`
    );
    const positive = 2**Byte.LENGTH - multiplicand.lowByte.number;

    result.highByte = result.highByte.add(new Byte(positive))[1];
    console.log(
      `corrected high byte ${result.highByte.bin}`,
      result.highByte.number
    );
  }

  toString() {
    return this.formattedBin;
  }

  public static divide(dividendInput: Register, dividerInput: Register) {
    // init result and current reminder (dividend may be copied to current reminder)
    const dividend = new Register(dividendInput.number)
    const divider = new Register(dividerInput.number)
    const currentReminder = new Register(dividend.number)
    // check validity of division
    const semiFirstStep = Register.isDivisionValid(currentReminder, dividend, divider)
    if (!semiFirstStep[0]) {
      throw new Error("division could not be performed")
    }
    const result = new Register(+semiFirstStep[1])

    Register.printBeauty(currentReminder, "current reminder before first step")
    
    // start division
    for (let i = 0; i < Byte.LENGTH - 1; i++) {
      console.log(`------------step ${i+2}------------`)
      // if equal -> subtract
      // if not -> add
      currentReminder.shiftLeft()
      Register.printBeauty(currentReminder, "current reminder shifted")
      
      if (currentReminder.sign == divider.sign) {
        console.log("signs are equal; subtracting")
        console.log("divider", new Byte(256 - divider.lowByte.number).bin)
        currentReminder.subtractHigh(divider.lowByte)
      } else {
        console.log("signs are different; adding")
        Register.printBeauty(divider, "divider")
        currentReminder.addHigh(divider.lowByte)
      }

      Register.printBeauty(currentReminder, "current reminder")
      const bit = +(currentReminder.sign == divider.sign) as Bit
      console.log(`signs: ${currentReminder.sign} --- ${divider.sign}`)
      result.shiftLeft(bit)
      Register.printBeauty(result, "result:")
      console.log("-------------------------------------")
    }
  
    return [result, new Register(currentReminder.highByte.number)]
  }

  static isDivisionValid(currentReminder: Register, dividendInput: Register, dividerInput: Register): [boolean, boolean] {
    console.log(dividendInput.number)
    // copy registers (they should not be mutated)
    const dividend = new Register(dividendInput.number)
    const divider = new Register(dividerInput.number)

    console.log(`dividend: ${dividend.formattedBin}`)
    console.log(`divider: ${divider.formattedBin}`)
    
    // if dividend and divider have same signs:
    if (dividend.sign == divider.sign) {
      console.log('signs are equal')
      // left shift dividend by one bit
      currentReminder.shiftLeft()
      console.log(`dividend after sift: ${currentReminder.formattedBin}`)

      currentReminder.subtractHigh(divider.lowByte)
      // subtract divider from high byte of dividend

    } else { 
      // add divider with low byte of dividend
      currentReminder.add(divider);
      console.log(`trial subtraction ${currentReminder.formattedBin}`)
      // left shift result by 1 bit
      currentReminder.shiftLeft()
      console.log(`result shifted ${currentReminder.formattedBin}`)
      // add divider with high byte of dividend
      currentReminder.addHigh(divider.lowByte)
    }

    console.log(`currentReminder: ${currentReminder.formattedBin}`)

    return [dividend.sign != currentReminder.sign, currentReminder.sign == divider.sign]

  }

  static printBeauty(reg: IRegister, message: string) {
    console.log(message, reg.formattedBin, reg.number.toString(), reg.numberSigned)
  }
}

// const testRegister = new Register(-1916);
// // testRegister.add(new Register(88))
// // const testRegister = new Register(-88)

// // const result = Register.multiply(testRegister, new Register(36));

// const test = new Register(26);
// const [result, reminder] = Register.divide(testRegister, test)
//   Register.printBeauty(result, "result")
// Register.printBeauty(reminder, "reminder")



// @ts-ignore
// console.log(result.formattedBin, result.number, result.numberSigned);
