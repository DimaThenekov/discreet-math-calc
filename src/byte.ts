import _ from "lodash";

export type ByteBinOpResult = { readonly carryOut: Bit; readonly result: Byte };

export type ByteBinOp = (this: Byte, b: Byte, carryIn: Bit) => ByteBinOpResult;

export type Bit = 0 | 1;
type RawByte = [Bit, Bit, Bit, Bit, Bit, Bit, Bit, Bit];
export type halfRawByte = [Bit, Bit, Bit, Bit];

declare global {
  interface Number {
    /** Lowest bit has index 0 */
    getBit(index: number): Bit;
  }

  interface Array<T> {
    reverseIterator(): IterableIterator<T>;
  }
}

Number.prototype.getBit = function getBit(index: number) {
  return +((this.valueOf() & (1 << index)) > 0) as Bit;
};

Array.prototype.reverseIterator = function reverseIterator<
  T
>(): IterableIterator<T> {
  const array = this;
  let index = array.length;
  let done = false;

  return {

    next(): IteratorResult<T> {
      // if not ran out of iterations
      // decrement index
      // otherwise set done to true
      
      if (!done) {
        index -= 1;
      }

      if (index === 0) {
        done = true
      }

      return {
        value: array[index],
        done
      }
    },

    [Symbol.iterator]() {
      return this
    }
  }

};

/**
 * piece of *mutable* data
 */
export class Byte {
  protected data: RawByte = [0, 0, 0, 0, 0, 0, 0, 0];
  static readonly LENGTH = 8;
  static readonly MAX = 2 ** Byte.LENGTH - 1;
  constructor(data: number = 0) {
    this.set(data);
  }

  protected static numberToRawByte(n: number): RawByte {
    // check if data is byte (has desired length)
    if (!Byte.canContain(n)) {
      throw new Error(
        `number: ${n} can not be contained inside byte. Max allowed value is: ${Byte.MAX}`
      );
    }
    // take each bit from lowest to highest
    const newRawByte: Bit[] = [];
    for (let i = 0; i < Byte.LENGTH; i++) {
      newRawByte.unshift(n.getBit(i));
    }
    console.assert(
      newRawByte.length == Byte.LENGTH,
      `trying to create rawByte with length ${newRawByte.length}. Length should be ${Byte.LENGTH}`
    );
    return newRawByte as RawByte;
  }

  private static canContain(number: number) {
    const mask = ~Byte.MAX;
    const nonDataPart = number & mask;
    return (nonDataPart ^ mask) == 0 || (nonDataPart ^ 0) == 0;
  }

  get highHalf(): number {
    return this.sliceNumber(0, Byte.LENGTH / 2);
  }

  get highHalfToByte() {
    return this.sliceToByte(0, Byte.LENGTH / 2, true);
  }

  get lowHalf(): number {
    return this.sliceNumber(Byte.LENGTH / 2);
  }

  get lowHalfToByte() {
    return this.sliceToByte(Byte.LENGTH / 2, Byte.LENGTH, true);
  }

  swap() {
    return new Byte(
      (this.lowHalf << (Byte.LENGTH / 2)) | this.highHalfToByte.number
    );
  }

  static performBinOp(a: Byte[], b: Byte[], op: ByteBinOp): [Bit, Byte[]] {
    console.assert(
      a.length >= b.length,
      "can't accommodate result in register"
    );
    const lengthDifference = a.length - b.length;

    // prevent mutation
    const result = a
    a = _.cloneDeep(a);
    b = _.cloneDeep(b);

    for (let i = 0; i < lengthDifference; i++) {
      b.unshift(new Byte(b[0].sign ? Byte.MAX : 0));
    }

    a.reverse();
    b.reverse();

    let carryBit: Bit = 0;

    for (let i = 0; i < b.length; i++) {
      const {carryOut: carryOut, result: resultByte} = op.call(a[i], b[i], carryBit) as Omit<
        ByteBinOpResult,
        never
      >;
      carryBit = carryOut;

      result[result.length - i - 1].set(resultByte.number);
    }

    return [carryBit, result];
  }

  /**
   * Performs bitwise not on a byte
   */
  not() {
    this.set((~this.number) & Byte.MAX);
  }

  add(byte: Byte, carryIn: Bit = 0): ByteBinOpResult {
    const result = this.number + byte.number + carryIn;
    const carryOut = result > Byte.MAX;

    return {
      carryOut: +carryOut,
      result: this.set(result & Byte.MAX),
    } as ByteBinOpResult;
  }

  subtract(byte: Byte, carryIn: Bit = 0): ByteBinOpResult {
    const result = this.number - byte.number - carryIn;
    const carryOut = result < 0;

    return {
      carryOut: +carryOut,
      result: this.set(result & Byte.MAX),
    } as ByteBinOpResult;
  }

  shiftRight(fill: Bit = this.sign) {
    const shiftedBit = this.data.pop();
    this.data.unshift(fill);

    return shiftedBit as Bit;
  }

  shiftRightArithmetic() {
    const shiftedBit = this.data.pop();
    this.data.splice(1, 0, 0);

    return shiftedBit as Bit;
  }

  shiftLeft(fill: Bit = 0) {
    const shiftedBit = this.data.shift();
    this.data.push(fill);

    return shiftedBit as Bit;
  }

  private static toNumber(input: string) {
    return parseInt(input, 2);
  }

  get number() {
    return Byte.toNumber(this.bin);
  }

  get absolute() {
    if (this.sign) {
      return 2 ** Byte.LENGTH - this.number;
    }

    return this.number;
  }

  get absoluteToByte() {
    return new Byte(this.absolute);
  }

  get bin() {
    return this.data.join("");
  }

  get sign() {
    return this.data[0];
  }

  set sign(sign: Bit) {
    this.setBit(7, sign);
  }

  sliceNumber(
    start: number,
    end: number = Byte.LENGTH,
    shouldEndShift = false
  ): number {
    console.assert(
      start >= 0 && start < end,
      `start should be in range: 0 <= start < ${end}; start = ${start}`
    );
    console.assert(
      end <= Byte.LENGTH,
      `end should be lower than byte length: ${end} <= ${Byte.LENGTH}`
    );
    const endShift = Byte.LENGTH - end;
    return (
      (this.number & ((Byte.MAX >> (start + endShift)) << endShift)) >>
      (shouldEndShift ? endShift : 0)
    );
  }

  sliceToByte(
    start: number,
    end: number = Byte.LENGTH,
    shouldEndShift = false
  ) {
    return new Byte(this.sliceNumber(start, end, shouldEndShift));
  }

  /** Numbering start from the least significant bit (2**0) */
  bit(index: number) {
    Byte.checkIndex(index);
    return this.data[Byte.computeIndex(index)];
  }

  set(number: number) {
    this.data = Byte.numberToRawByte(number);
    return this;
  }

  setBit(index: number, bit: Bit) {
    Byte.checkIndex(index);
    this.data[Byte.computeIndex(index)] = bit;
  }

  private static checkIndex(index: number) {
    console.assert(
      index >= 0 && index < Byte.LENGTH,
      `byte has only ${Byte.LENGTH} bits. trying to access: ${index}`
    );
  }

  private static computeIndex(index: number) {
    return Byte.LENGTH - index - 1;
  }

  static twosComplement(number: number, width?: number): number {
    width = width ?? number > Byte.MAX ? 16 : 8;
    return number >= 0 ? number : 2 ** width - number;
  }

  static fill(amount: number): Byte[] {
    const bytes: Byte[] = [];

    for (let i = 0; i < amount; i++) {
      bytes.push(new Byte());
    }

    return bytes;
  }
}

// const test = new Byte(0b11110001)
// const sliced = test.sliceToByte(3, 7)
// const sliced = test.sliceToByte(1)
// console.log(sliced.bin)
