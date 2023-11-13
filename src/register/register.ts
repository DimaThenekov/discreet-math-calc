import { Byte, Bit } from "../byte.js";
import { cloneDeep } from "lodash";

export interface ISnapshotable<T> {
  snapshot(): T
}

export interface IRegister {
  formattedBin: string;
  number: number | BigInt;
  numberSigned: number | bigint;
}

/**
 * Register is a visitor of some binary data storage.
 * It acts like a proxy, overlay over the storage.
 * Therefore multiple registers can be setup for single storage,
 * allowing to manipulate its data as a whole or in parts precisely.
 * 
 * Use this knowledge to access highHalf and lowHalf
 */
export class Register implements IRegister, ISnapshotable<Register> {
  public readonly WIDTH: number;

  private get MAX() {
    return 2n ** BigInt(this.WIDTH * Byte.LENGTH) - 1n;
  }

  /** @argument WIDTH amount of bytes to use */
  constructor(protected bytes: Byte[]) {
    this.WIDTH = bytes.length;
    console.assert(
      this.WIDTH >= 1,
      "can't create register shorter then 1 byte"
    );
  }

  set(dataInput: number | bigint | Byte[]): this {
    if (typeof dataInput === "number" || typeof dataInput === "bigint") {
      let data = BigInt(dataInput);
      const maxAllowedNumber = this.MAX
      // console.assert(dataInput <= maxAllowedNumber, `number ${dataInput} can't be stored inside register with width ${this.WIDTH}
      // Max allowed number is ${maxAllowedNumber}`)
      if (data > maxAllowedNumber) {
        throw new Error(`number ${data} is too big. Max allowed number is ${maxAllowedNumber}`)
      }

      const mask = BigInt(Byte.MAX);

      for (let i = this.WIDTH - 1; i >= 0; i--) {
        const value = Number(data & mask);
        data = data >> BigInt(Byte.LENGTH);

        this.bytes[i].set(value);
      }
    } else {
      for (let i = this.WIDTH - dataInput.length; i < this.WIDTH; i++) {
        dataInput.unshift(new Byte(0));
      }
      this.bytes = dataInput;
    }

    return this;
  }

  getBit(index: number) {
    return this.getByte(Math.floor(index / Byte.LENGTH)).bit(index % Byte.LENGTH)
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

  set sign(bit: Bit) {
    this.bytes[0].sign = bit;
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
        return byte.bin;
      })
      .filter((value) => value != null)
      .join(" ");
  }

  /**
   * Inverts sign of a number stored in register
   */
  neg() {
    this.bytes.forEach((byte) => Byte.prototype.not.call(byte))
    this.add(new Register(Byte.fill(this.WIDTH)).set(1))
    return this;
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

  getByte(index: number) {
    return this.bytes.at(index * -1 - 1) as Byte;
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

  snapshot(): Register {
    return cloneDeep(this);
  }

  toString() {
    return this.formattedBin;
  }

  /**
   * 
   * @param message prefix to prepend to beautiful output
   * @returns formatted string
   */
  formatBeauty(message: string = "") {
    return [
      message,
      this.formattedBin,
      this.number.toString(),
      this.numberSigned
    ].join(" ");
  }
}

enum ESide {
  LEFT,
  RIGHT,
}

export class RegisterWithCursor extends Register {
  /**
   * Measured in bits
   */
  cursorPosition: number = 0;
  /**
   * On which side of character at `cursorPosition` to display cursor
   * 
   * DEFAULT: `ESide.LEFT`
   */
  side: ESide = ESide.LEFT;

  public static readonly CURSOR_SYMBOL = "|";

  override shiftLeft(fill?: Bit): Bit {
    this.cursorPosition += 1;
    return super.shiftLeft(fill);
  }

  override shiftRight(fill?: Bit): Bit {
    this.cursorPosition -= 1;
    return super.shiftRight(fill);
  }

  override shiftRightArithmetic(): Bit {
    this.cursorPosition -= 1;
    return super.shiftRightArithmetic();
  }

  override get formattedBin() {
    const bitStrings = this.bytes.map((byte) => {
      return byte.bin;
    });

    const cursorByteIndex = this.bytes.length - Math.floor(this.cursorPosition / Byte.LENGTH) - 1;
    const stringForCursor = bitStrings[cursorByteIndex] ?? "";
    const cursorStringIndex =
      stringForCursor.length - (this.cursorPosition % Byte.LENGTH);
    
      bitStrings[cursorByteIndex] = stringForCursor.slice(0, cursorStringIndex) +
      RegisterWithCursor.CURSOR_SYMBOL +
      stringForCursor.slice(cursorStringIndex);

      return bitStrings.join(" ")
    
  }
}

// const a = new Register(4).set(0b1010_1100_1100)
// const b = new Register(4).set(0b1000_1011_0100)
// const aBytes = Byte.fill(2);
// const bBytes = Byte.fill(2);

// const aReg = new Register(aBytes).set(-1916);
// const bReg = new Register(bBytes).set(26);

// divide(aReg, bReg)

// const result = Register.multiply(a, b, EMethod.FAST_4)

// Register.printBeauty(result, "result")
