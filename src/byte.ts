export type ByteBinOpResult = readonly [Bit, Byte];

export type Bit = 0 | 1;
type RawByte = [Bit, Bit, Bit, Bit, Bit, Bit, Bit, Bit];
export type halfRawByte = [Bit ,Bit, Bit, Bit]

export class Byte {
  private data: RawByte;
  static readonly LENGTH = 8
  static readonly MAX = 2**Byte.LENGTH-1
  constructor(data: number) {
    const input = data
      .toString(2)
      .padStart(Byte.LENGTH, "0")
      .split("")
      .map((bit) => parseInt(bit, 2));
    const isRawByte = this.isRawByte(input);

    console.assert(isRawByte, `${input} is not a byte`);

    if (isRawByte) {
      this.data = input;
    } else {
      throw new TypeError(`${input} is not a byte`);
    }
  }

  get highHalf(): number {
    return this.sliceNumber(0, Byte.LENGTH / 2)
  }

  get highHalfToByte() {
    return this.sliceToByte(0, Byte.LENGTH / 2, true)
  }

  get lowHalf(): number {
    return this.sliceNumber(Byte.LENGTH / 2)
  }

  get lowHalfToByte() {
    return this.sliceToByte(Byte.LENGTH / 2, Byte.LENGTH, true)
  }

  swap() {
    return new Byte((this.lowHalf << (Byte.LENGTH / 2) | this.highHalfToByte.number))
  }

  private isRawByte(data: number[]): data is RawByte {
    return data.length == Byte.LENGTH && data.every(Byte.isBit);
  }

  private static isBit(num: number): num is Bit {
    return num == 0 || num == 1;
  }

  add(byte: Byte, carryIn: Bit = 0): ByteBinOpResult {
    const result = this.number + byte.number + carryIn;
    const carryOut = result > (Byte.MAX);

    return [+carryOut, new Byte(result & Byte.MAX)] as ByteBinOpResult;
  }

  subtract(byte: Byte, carryIn: Bit = 0): ByteBinOpResult {
    const result = this.number - byte.number - carryIn;
    const carryOut = result < 0;

    return [+carryOut, new Byte(result & (Byte.MAX))] as ByteBinOpResult;
  }

  shiftRight(fill: Bit = this.sign) {
    const shiftedBit = this.data.pop();
    this.data.unshift(fill);

    return shiftedBit as Bit;
  }

  shiftRightArithmetic() {
    const shiftedBit = this.data.pop()
    this.data.splice(1, 0, 0)

    return shiftedBit as Bit
  }

  shiftLeft(fill: Bit = 0) {
    const shiftedBit = this.data.shift()
    this.data.push(fill)

    return shiftedBit as Bit
  }

  private static toNumber(input: string) {
    return parseInt(input, 2)
  }

  get number() {
    return Byte.toNumber(this.bin)
  }
 
  get absolute() {
    if (this.sign) {
      return (2 ** Byte.LENGTH) - this.number
    }

    return this.number
  }

  get absoluteToByte() {
    return new Byte(this.absolute)
  }

  get bin() {
    return this.data.join("");
  }

  get sign() {
    return this.data[0];
  }

  set sign(sign: Bit) {
    this.setBit(7, sign)
  }

  sliceNumber(start: number, end: number = Byte.LENGTH, shouldEndShift = false): number {
    console.assert(start >= 0 && start < end, `start should be in range: 0 <= start < ${end}; start = ${start}`)
    console.assert(end <= Byte.LENGTH, `end should be lower than byte length: ${end} <= ${Byte.LENGTH}`)
    const endShift = Byte.LENGTH - end
    return (this.number & (((Byte.MAX >> (start + endShift)) << (endShift)))) >> (shouldEndShift ? endShift : 0)
  }

  sliceToByte(start: number, end: number = Byte.LENGTH, shouldEndShift = false) {
    return new Byte(this.sliceNumber(start, end, shouldEndShift))
  }

  /** Numbering start from the least significant bit (2**0) */
  bit(index: number) {
    Byte.checkIndex(index)
    return this.data[Byte.computeIndex(index)]
  }

  setBit(index: number, bit: Bit) {
     Byte.checkIndex(index);
     this.data[Byte.computeIndex(index)] = bit
  }

  private static checkIndex(index: number) {
    console.assert(index >= 0 && index < Byte.LENGTH, `byte has only ${Byte.LENGTH} bits. trying to access: ${index}`)
  }

  private static computeIndex(index: number) {
    return Byte.LENGTH - index - 1
  }

  static twosComplement(number: number, width?: number): number {
    width = width ?? number > Byte.MAX ? 16 : 8;
    return number >= 0 ? number : 2 ** width - number;
  }
}

// const test = new Byte(0b11110001)
// const sliced = test.sliceToByte(3, 7)
// const sliced = test.sliceToByte(1)

// console.log(sliced.bin)