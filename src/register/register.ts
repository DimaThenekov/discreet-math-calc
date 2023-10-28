import { Byte, Bit } from "../byte";
import cloneDeep from "lodash/cloneDeep";

enum EAction {
  SHIFT,
  ADD_SHIFT,
}

export enum EMethod {
  WITH_CORRECTION,
  BUTE_METHOD,
  FAST_2,
  FAST_4,
}

export interface IRegister {
  formattedBin: string;
  number: number | BigInt;
  numberSigned: number | bigint;
}

export class Register implements IRegister {
  private bytes: Byte[] = [];

  private get MAX() {
    return 2n ** BigInt(this.WIDTH * Byte.LENGTH) - 1n;
  }

  /** @argument WIDTH amount of bytes to use */
  constructor(readonly WIDTH: number) {
    console.assert(WIDTH % 2 == 0, "incorrect WIDTH");

    for (let i = 0; i < WIDTH; i++) {
      this.bytes.push(new Byte(0));
    }
  }

  set(dataInput: number | bigint | Byte[]): this {
    if (typeof dataInput === "number" || typeof dataInput === "bigint") {
      let data = BigInt(dataInput);
      // const maxAllowedNumber = this.MAX
      // console.assert(dataInput <= maxAllowedNumber, `number ${dataInput} can't be stored inside register with width ${this.WIDTH}
      // Max allowed number is ${maxAllowedNumber}`)

      const mask = BigInt(Byte.MAX);

      const newBytes: Byte[] = [];

      for (let i = this.WIDTH; i > 0; i--) {
        const value = Number(data & mask);
        data = data >> BigInt(Byte.LENGTH);

        newBytes.unshift(new Byte(value));
      }

      console.assert(
        newBytes.length === this.WIDTH,
        "length of array to set must be equal to WIDTH"
      );
      this.bytes = newBytes;
    } else {
      for (let i = this.WIDTH - dataInput.length; i < this.WIDTH; i++) {
        dataInput.unshift(new Byte(0));

        this.bytes = dataInput;
      }
    }

    return this;
  }

  get highHalf() {
    return this.bytes.slice(0, this.center);
  }

  private set highHalf(bytes: Byte[]) {
    console.assert(bytes.length == this.center);

    this.bytes.splice(0, this.center, ...bytes);
  }

  private get center(): number {
    return Math.floor(this.WIDTH / 2);
  }

  get lowHalf() {
    return this.bytes.slice(this.center);
  }

  get sign() {
    return this.bytes[0].sign;
  }

  get number(): bigint {
    return this.bytes.reduce((result, currentByte) => {
      result <<= BigInt(Byte.LENGTH);
      result += BigInt(currentByte.number);
      return result;
    }, 0n);
  }

  get numberSigned() {
    if (this.sign) {
      return -1n * (this.MAX + 1n - this.number);
    }

    return this.number;
  }

  get formattedBin(): string {
    let nonNull = false;

    return this.bytes
      .map((byte, i, a) => {
        if (!nonNull && byte.number == 0 && i != a.length - 1) {
          return null;
        }

        nonNull = true;
        return (this.center == i ? "| " : "") + byte.bin;
      })
      .filter((value) => value != null)
      .join(" ");
  }

  shiftLeft(fill: Bit = 0) {
    for (let i = 0; i < this.bytes.length; i++) {
      fill = this.getByte(i)!.shiftLeft(fill);
    }

    return fill;
  }

  shiftRight(fill: Bit = this.sign) {
    for (let i = 0; i < this.bytes.length; i++) {
      fill = this.bytes[i].shiftRight(fill);
    }

    return fill;
  }

  private getByte(index: number) {
    return this.bytes.at(index * -1 - 1);
  }

  shiftRightArithmetic() {
    let fill: Bit = this.bytes[0].shiftRightArithmetic();

    // staring from one 'cause operation of first byte is already performed
    for (let i = 1; i < this.bytes.length; i++) {
      fill = this.bytes[i].shiftRight(fill);
    }

    return fill;
  }

  add(reg: Register): Bit {
    console.assert(
      reg.WIDTH <= this.WIDTH,
      "can't accommodate result in register"
    );
    const a = this;
    const b = reg;

    const [carryBit, result] = Byte.performBinOp(
      a.bytes,
      b.bytes,
      Byte.prototype.add
    );

    this.bytes = result;

    return carryBit;
  }

  addHigh(reg: Register, forceTruncation = false) {
    let carryOut: Bit = 0;
    let result: Byte[] = [];

    [carryOut, result] = this.withSafe(reg, forceTruncation, (safeBytes) => {
      return Byte.performBinOp(this.highHalf, safeBytes, Byte.prototype.add);
    });

    this.highHalf = result;

    return carryOut;
  }

  private withSafe<T>(
    reg: Register,
    forceTruncation = false,
    fun: (reg: Byte[]) => T
  ): T {
    const canAccommodate = this.WIDTH >= reg.WIDTH * 2;
    const isHighHalfEmpty =
      new Register(reg.WIDTH).set(reg.highHalf).number == 0n;
    const isSafe = canAccommodate || isHighHalfEmpty || forceTruncation;

    if (!isSafe) {
      console.assert(
        `not safe to perform ${fun.name} when high half is not empty and can't accommodate result`
      );
      throw new Error();
    }

    return fun(canAccommodate ? reg.bytes : reg.lowHalf);
  }

  subtract(reg: Register) {
    const a = this;
    const b = reg;

    const [carryOut, result] = Byte.performBinOp(
      a.bytes,
      b.bytes,
      Byte.prototype.subtract
    );
    this.bytes = result;

    return carryOut;
  }

  subtractHigh(reg: Register, forceTruncation = false) {
    let carryOut: Bit = 0;
    let result: Byte[] = [];

    [carryOut, result] = this.withSafe(reg, forceTruncation, (safeBytes) => {
      return Byte.performBinOp(
        this.highHalf,
        safeBytes,
        Byte.prototype.subtract
      );
    });

    this.highHalf = result;

    return carryOut;
  }

  static multiply(
    a: Register,
    b: Register,
    method: EMethod = EMethod.WITH_CORRECTION
  ) {
    console.log(`multiplicand ${a.formattedBin}`);
    console.log(`multiplier   ${b.formattedBin}`);
    console.log(`using ${method}`);
    console.log("---starting multiplication----");

    switch (method) {
      case EMethod.WITH_CORRECTION:
        return Register.multiplyWithCorrection(a, b);

      case EMethod.BUTE_METHOD:
        return Register.multiplyBute(a, b);

      case EMethod.FAST_2:
        return Register.multiplyFast2(a, b);

      case EMethod.FAST_4:
        return Register.multiplyFast4(a, b);
    }
  }

  private static multiplyWithCorrection(a: Register, b: Register) {
    const result = new Register(a.WIDTH * 2);

    for (let i = 0; i < Byte.LENGTH * b.WIDTH; i++) {
      console.log(`--------------${i + 1}--------------`);

      if (b.shiftRight() == EAction.SHIFT) {
        console.log("shifting");
        console.log(`result reg before shifting: ${result.formattedBin}`);

        result.shiftRight();

        console.log(`result reg shifted ${result.formattedBin}`);
      } else {
        console.log("adding and shifting");

        result.addHigh(a);
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
    const result = new Register(a.WIDTH * 2);

    let lastShift: Bit = 0;

    for (let i = 0; i < Byte.LENGTH * b.WIDTH; i++) {
      console.log(`--------------${i + 1}--------------`);
      // 1 -> 0  +++ shift
      // 0 -> 1  --- shift
      // if does not changed: shift
      const currentShift = b.shiftRight();
      if (lastShift != currentShift) {
        console.log(
          `shifted bits are different: lastShift ${lastShift}; currentShift ${currentShift}`
        );
        if (lastShift) {
          console.log("adding");
          result.addHigh(a);
          console.log(
            `addition result ${result.formattedBin}; num: ${result.number}`
          );
        } else {
          console.log("subtracting");
          result.subtractHigh(a);
          console.log(
            `subtraction result ${result.formattedBin}; num: ${result.number}`
          );
        }
      }

      console.log("shifting");
      result.shiftRight();

      lastShift = currentShift;

      Register.printBeauty(result, "intermediate result");
    }

    return result;
  }

  private static correction(result: Register, multiplicand: Register) {
    console.log(
      `performing correction on ${result.highHalf
        .map((byte) => byte.bin)
        .join(" ")} by ${multiplicand.lowHalf
        .map((byte) => byte.bin)
        .join(" ")}`
    );

    const correction = new Register(multiplicand.WIDTH).set(
      -multiplicand.number
    );

    result.addHigh(correction);

    console.log(
      `corrected high byte ${result.highHalf.join(" ")}`,
      parseInt(result.highHalf.join(""))
    );
  }

  private static multiplyFast2(a: Register, b: Register) {
    const result = new Register(a.WIDTH * 2);

    let correction: Bit = 0;
    let action = 0;
    for (let i = 0; i < (Byte.LENGTH * b.WIDTH) / 2; i++) {
      console.log(`---------------------step ${i + 1}---------------------`);
      action = b.getByte(0)!.add(new Byte(correction))[1].sliceNumber(6, 8);
      b.shiftRight();
      b.shiftRight();

      console.log(`action ${action.toString(2)} ${correction}:`);

      switch (action) {
        case 0b00:
          break;
        case 0b01:
          Register.shiftAddAction(result, a, false, 0);
          break;
        case 0b10:
          Register.shiftAddAction(result, a, false, 1);
          break;
        case 0b11:
          Register.shiftAddAction(result, a, true, 0);
          break;
      }

      result.shiftRight();
      result.shiftRight();

      Register.printBeauty(result, "shifted           ");

      correction = +(action == 3 || (action == 0 && correction == 1)) as Bit;
    }

    if (action == 1) {
      result.addHigh(a);
    }

    return result;
  }

  private static multiplyFast4(a: Register, b: Register) {
    const result = new Register(a.WIDTH * 2);

    let correction: Bit = 0;
    let internalCorrection: Bit = 0;

    let actionLow = 0;
    let actionHigh = 0;
    for (let i = 0; i < (Byte.LENGTH * b.WIDTH) / 4; i++) {
      console.log(`---------------------step ${i + 1}---------------------`);

      const actionByteWithCorrection = b
        .getByte(0)!
        .sliceToByte(4, 8, true)
        .add(new Byte(correction))[1];
      const actionByteWithCorrectionTruncated =
        actionByteWithCorrection.sliceToByte(4, 8, true);
      actionLow = actionByteWithCorrectionTruncated.sliceNumber(6, 8, true);
      internalCorrection = +(actionLow == 0b11) as Bit;

      actionHigh =
        (actionByteWithCorrectionTruncated.sliceNumber(4, 6, true) +
          internalCorrection) &
        0b11;

      console.log(
        actionHigh.toString(2).padStart(2, "0") +
          actionLow.toString(2).padStart(2, "0")
      );

      correction = +(actionByteWithCorrection.number >= 0b1011) as Bit;

      b.shiftRight();
      b.shiftRight();
      b.shiftRight();
      b.shiftRight();

      console.log(`actionLow ${actionLow.toString(2)} ${correction}:`);

      switch (actionLow) {
        case 0b00:
          break;
        case 0b01:
          Register.shiftAddAction(result, a, false, 0);
          break;
        case 0b10:
          Register.shiftAddAction(result, a, false, 1);
          break;
        case 0b11:
          Register.shiftAddAction(result, a, true, 0);
          break;
      }

      console.log(
        `actionHigh ${actionHigh.toString(2)} ${internalCorrection}:`
      );

      switch (actionHigh & 0b11) {
        case 0b00:
          break;
        case 0b01:
          Register.shiftAddAction(result, a, false, 2);
          break;
        case 0b10:
          Register.shiftAddAction(result, a, false, 3);
          break;
        case 0b11:
          Register.shiftAddAction(result, a, true, 2);
          break;
      }

      result.shiftRight();
      result.shiftRight();
      result.shiftRight();
      result.shiftRight();

      Register.printBeauty(result, "shifted           ");
    }

    if (actionLow == 1) {
      result.addHigh(a);
    }

    return result;
  }

  private static shiftAddAction(
    result: Register,
    a: Register,
    negative: boolean,
    shiftBy: number
  ) {
    const add = new Register(a.WIDTH * 2);
    if (negative) {
      add.subtract(a);
    } else {
      add.add(a);
    }

    for (let i = 0; i < shiftBy; i++) {
      add.shiftLeft();
    }
    const actionName = negative ? "subtract" : "add";
    const resultName = negative ? "subtraction" : "addition";

    Register.printBeauty(
      add,
      `shift left ${shiftBy != 1 ? shiftBy + " " : ""}and ${actionName}`
    );
    result.addHigh(add, true);
    Register.printBeauty(result, `${resultName} result   `);
    return result;
  }

  toString() {
    return this.formattedBin;
  }

  public static divide(dividendInput: Register, dividerInput: Register) {
    // init result and current reminder (dividend may be copied to current reminder)
    const dividend = new Register(dividendInput.WIDTH).set(
      dividendInput.numberSigned
    );
    const divider = new Register(dividerInput.WIDTH).set(
      dividerInput.numberSigned
    );
    const currentReminder = new Register(dividendInput.WIDTH).set(
      dividend.numberSigned
    );
    // check validity of division
    const semiFirstStep = Register.isDivisionValid(
      currentReminder,
      dividend,
      divider
    );
    if (!semiFirstStep[0]) {
      throw new Error("division could not be performed");
    }
    const result = new Register(dividend.WIDTH / 2).set(+semiFirstStep[1]);

    Register.printBeauty(currentReminder, "current reminder before first step");

    // start division
    for (let i = 0; i < Byte.LENGTH - 1; i++) {
      console.log(`------------step ${i + 2}------------`);
      // if equal -> subtract
      // if not -> add
      currentReminder.shiftLeft();
      Register.printBeauty(currentReminder, "current reminder shifted");

      if (currentReminder.sign == divider.sign) {
        console.log("signs are equal; subtracting");
        const negative = new Register(divider.WIDTH);
        negative.subtract(divider);
        Register.printBeauty(negative, "negative");
        currentReminder.addHigh(negative, true);
      } else {
        console.log("signs are different; adding");
        Register.printBeauty(divider, "divider");
        currentReminder.addHigh(divider);
      }

      Register.printBeauty(currentReminder, "current reminder");
      const bit = +(currentReminder.sign == divider.sign) as Bit;
      console.log(`signs: ${currentReminder.sign} --- ${divider.sign}`);
      result.shiftLeft(bit);
      Register.printBeauty(result, "result:");
      console.log("-------------------------------------");
    }

    return [
      result,
      new Register(currentReminder.WIDTH).set(currentReminder.highHalf),
    ];
  }

  static isDivisionValid(
    currentReminder: Register,
    dividendInput: Register,
    dividerInput: Register
  ): [boolean, boolean] {
    // copy registers (they should not be mutated)
    const dividend = cloneDeep(dividendInput);
    const divider = cloneDeep(dividerInput);

    console.log(`dividend: ${dividend.formattedBin}`);
    console.log(`divider: ${divider.formattedBin}`);

    // if dividend and divider have same signs:
    if (dividend.sign == divider.sign) {
      console.log("signs are equal");
      // left shift dividend by one bit
      currentReminder.shiftLeft();
      console.log(`dividend after sift: ${currentReminder.formattedBin}`);

      currentReminder.subtractHigh(divider);
      // subtract divider from high byte of dividend
    } else {
      // add divider with low byte of dividend
      currentReminder.add(divider);
      console.log(`trial subtraction ${currentReminder.formattedBin}`);
      // left shift result by 1 bit
      currentReminder.shiftLeft();
      console.log(`result shifted ${currentReminder.formattedBin}`);
      // add divider with high byte of dividend
      currentReminder.addHigh(divider);
    }

    console.log(`currentReminder: ${currentReminder.formattedBin}`);

    return [
      dividend.sign != currentReminder.sign,
      currentReminder.sign == divider.sign,
    ];
  }

  static printBeauty(reg: IRegister, message: string) {
    console.log(
      message,
      reg.formattedBin,
      reg.number.toString(),
      reg.numberSigned
    );
  }
}

// const a = new Register(4).set(0b1010_1100_1100)
// const b = new Register(4).set(0b1000_1011_0100)

// const result = Register.multiply(a, b, EMethod.FAST_4)

// Register.printBeauty(result, "result")
