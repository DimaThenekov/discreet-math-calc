import {Byte, Bit} from "./byte";

enum EAction {
  SHIFT,
  ADD_SHIFT,
}

export enum EMethod {
  WITH_CORRECTION,
  BUTE_METHOD,
}

export interface IRegister {
  formattedBin: string,
  number: number | BigInt,
  numberSigned: number | bigint
}

export class Register implements IRegister {
  private bytes: Byte[] = []

  private get MAX() {
    return 2n**(BigInt(this.WIDTH * Byte.LENGTH)) - 1n
  }

  /** @argument WIDTH amount of bytes to use */
  constructor(readonly WIDTH: number) {
    console.assert(WIDTH % 2 == 0, "incorrect WIDTH")

    for (let i = 0; i < WIDTH; i++) {
      this.bytes.push(new Byte(0))
    }
  }

  set(dataInput: number | bigint | Byte[]): this {
    if (typeof dataInput === "number" || typeof dataInput === "bigint") {
      let data = BigInt(dataInput)
      const maxAllowedNumber = this.MAX
      console.assert(dataInput <= maxAllowedNumber, `number ${dataInput} can't be stored inside register with width ${this.WIDTH}
      Max allowed number is ${maxAllowedNumber}`)

      const mask = BigInt(Byte.MAX)
      
      const newBytes: Byte[] = []
      
      for (let i = this.WIDTH; i > 0; i--) {
        const value = Number(data & mask)
        data = data >> BigInt(Byte.LENGTH)
        
        newBytes.unshift(new Byte(value))
      }
      
      console.assert(newBytes.length === this.WIDTH, "length of array to set must be equal to WIDTH")
      this.bytes = newBytes
    } else {
      for (let i = this.WIDTH - dataInput.length; i < this.WIDTH; i++) {
        dataInput.unshift(new Byte(0))

        this.bytes = dataInput
      }
    }

    return this
  }

  get highHalf() {
    return this.bytes.slice(0, this.center)
  }

  private set highHalf(bytes: Byte[]) {
    console.assert(bytes.length == this.center)

    this.bytes.splice(0, this.center, ...bytes)
  }

  private get center(): number {
    return Math.floor(this.WIDTH / 2)
  }

  get lowHalf() {
    return this.bytes.slice(this.center)
  }

  get sign() {
    return this.bytes[0].sign
  }

  get number(): bigint {
    return this.bytes.reduce((result, currentByte) => {
      result <<= BigInt(Byte.LENGTH)
      result += BigInt(currentByte.number)
      return result
    }, 0n)
  }

  get numberSigned() {
    if (this.sign) {
      return -1n * ((this.MAX + 1n) - this.number);
    }

    return this.number;
  }

  get formattedBin(): string {
    let nonNull = false

    return this.bytes.map((byte, i, a) => {
      if (!nonNull && byte.number == 0 && i != a.length - 1) {
        return null
      }

      nonNull = true
      return byte.bin
    }).filter((value) => value != null).join(" ")
  }

  shiftLeft(fill: Bit = 0) {
    for (let i = 0; i < this.bytes.length; i++) {
      fill = this.getByte(i)!.shiftLeft(fill)
    }
    
    return fill
  }

  shiftRight(fill: Bit = this.sign) {
    for (let i = 0; i < this.bytes.length; i++) {
      fill = this.bytes[i].shiftRight(fill)
    }

    return fill
  }

  private getByte(index: number) {
    return this.bytes.at(index*-1 -1)
  }

  shiftRightArithmetic() {
    let fill: Bit = this.bytes[0].shiftRightArithmetic()
    
    // staring from one 'cause operation of first byte is already performed
    for (let i = 1; i < this.bytes.length; i++) {
      fill = this.bytes[i].shiftRight(fill)
    }

    return fill
  }

  add(reg: Register): Bit {
    console.assert(reg.WIDTH <= this.WIDTH, "can't accommodate result in register")
    const a = this
    const b = reg

    const [carryBit, result] = Byte.performBinOp(a.bytes, b.bytes, Byte.prototype.add)
 
    this.bytes = result

    return carryBit
  }

  addHigh(reg: Register) {
    const [carryOut, result] = Byte.performBinOp(this.highHalf, reg.lowHalf, Byte.prototype.add)
    this.highHalf = result

    return carryOut
  }

  subtract(reg: Register) {
    const a = this
    const b = reg

    const [carryOut, result] = Byte.performBinOp(a.bytes, b.bytes, Byte.prototype.subtract)
    this.bytes = result

    return carryOut
  }

  subtractHigh(reg: Register) {
    const [carryOut, result] = Byte.performBinOp(this.highHalf, reg.lowHalf, Byte.prototype.subtract)
    this.highHalf = result

    return carryOut
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
    const result = new Register(a.WIDTH * 2);

    for (let i = 0; i < Byte.LENGTH * a.WIDTH; i++) {
      console.log(`--------------${i + 1}--------------`);

      if (b.shiftRight() == EAction.SHIFT) {
        console.log("shifting");
        console.log(`result reg before shifting: ${result.formattedBin}`);

        result.shiftRight();

        console.log(`result reg shifted ${result.formattedBin}`);
      } else {
        console.log("adding and shifting");

        result.addHigh(a)
        console.log(
          `addition result ${result.formattedBin}; num: ${result.number}`
        );

        result.shiftRight(a.sign);
      }

      console.log(
        `intermediate result ${result.formattedBin}; num ${result.number}`
      );
    }

    if (b.sign) {
      Register.correction(result, a);
    }

    return result;
  }

  private static multiplyBute(a: Register, b: Register): Register {
    
    const result = new Register(a.WIDTH * 2)
    
    let lastShift: Bit = 0

    for (let i = 0; i < Byte.LENGTH * (a.WIDTH); i++ ) {
      console.log(`--------------${i + 1}--------------`);
      // 1 -> 0  +++ shift
      // 0 -> 1  --- shift
      // if does not changed: shift
      const currentShift = b.shiftRight()
      if (lastShift != currentShift) {
        console.log(`shifted bits are different: lastShift ${lastShift}; currentShift ${currentShift}`)
        if (lastShift) {
          console.log("adding")
          result.addHigh(a)
          console.log(`addition result ${result.formattedBin}; num: ${result.number}`)
        } else {
          console.log("subtracting")
          result.subtractHigh(a)
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
      `performing correction on ${result.highHalf.join(" ")} by ${multiplicand.lowHalf.join(" ")} ${parseInt(multiplicand.lowHalf.join(""))}`
    );    

    const correction = new Register(result.WIDTH).set(multiplicand.numberSigned*-1n)

    result.addHigh(correction)

    console.log(
      `corrected high byte ${result.highHalf.join(" ")}`,
      parseInt(result.highHalf.join(""))
    );
  }

  toString() {
    return this.formattedBin;
  }

/*   public static divide(dividendInput: Register, dividerInput: Register) {
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

  } */

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

// const a = new Register(4).set(-88)
// const b = new Register(4).set(36)

// const result = Register.multiply(a, b)

// Register.printBeauty(result, "result")



// @ts-ignore
// console.log(result.formattedBin, result.number, result.numberSigned);
