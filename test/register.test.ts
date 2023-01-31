import assert from "assert";
import { describe, it } from "mocha";
import { EMethod, Register } from "../src/int16";

console.log = () => {}

describe("Register", () => {
  const a = 88
  const b = 36
  
  describe("addition", () => {
    const aReg = new Register(2)
    const bReg = new Register(2)

    it(`${a} + ${b} = ${a + b}`, () => {
      aReg.set(a)
      bReg.set(b)

      aReg.add(bReg)

      assert.equal(aReg.numberSigned, a + b)
    })

    it(`${a} + (${-b}) = ${a - b}`, () => {
      aReg.set(a)
      bReg.set(-b)
      
      aReg.add(bReg)

      assert.equal(aReg.numberSigned, a - b)
    })

    it(`(${-a}) + ${b} = ${-a + b}`, () => {
      aReg.set(-a)
      bReg.set(b)

      aReg.add(bReg)

      assert.equal(aReg.numberSigned, -a + b)
    })

    it(`(${-a}) + ${-b} = ${-a + -b}`, () => {
      aReg.set(-a)
      bReg.set(-b)

      aReg.add(bReg)

      assert.equal(aReg.numberSigned < 0, true, "should be negative")
      assert.equal(aReg.numberSigned, -a - b)
    })

    it(`${-b} + ${-a} = ${-b - a}`, () => {
      aReg.set(-a)
      bReg.set(-b)

      bReg.add(aReg)

      assert.equal(bReg.numberSigned, -b - a)
    })

    it("overflow", () => {
      aReg.set(2**16 - 1)
      bReg.set(1)
      const overflow = aReg.add(bReg)

      assert.equal(overflow, 1)
    })

    it("0 + 0 = 0", () => {
      aReg.set(0)
      bReg.set(0)

      aReg.add(bReg)

      assert.equal(aReg.numberSigned, 0)
    })

    it("0 - 1 = -1", () => {
      aReg.set(0)
      bReg.set(-1)

      aReg.add(bReg)

      assert.equal(aReg.numberSigned, -1)

    })

    it("add high", () => {
      aReg.set(14080)
      bReg.set(55)

      aReg.addHigh(bReg)

      assert.equal(aReg.numberSigned, 28160)
    })
  })

  describe("subtract", () => {
    const aReg = new Register(2)
    const bReg = new Register(2)

    it(`${a} - ${b} = ${a - b}`, () => {
      aReg.set(a)
      bReg.set(b)

      aReg.subtract(bReg)

      assert.equal(aReg.numberSigned, a - b)
    })

    it(`${-a} - ${b} = ${-a - b}`, () => {
      aReg.set(-a)
      bReg.set(b)

      aReg.subtract(bReg)

      assert.equal(aReg.numberSigned, -a -b)
    })
  })

  describe("shift", () => {
    const aReg = new Register(2)
    
    it("shift right", () => {
      const number = -0b111001011
      aReg.set(number)
      
      const shiftedBit = aReg.shiftRight()

      assert.equal(shiftedBit, 1)
      assert.equal(aReg.numberSigned, number >> 1)
    })
  })

  describe("multiplication, 8 bytes result", () => {
    describe("with correction", () => {

      const aReg = new Register(4)
      const bReg = new Register(4)
      
      it(`${a} * ${b} = ${a * b}`, () => {
        aReg.set(a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg)

        assert.equal(result.numberSigned, a*b)
      })
      
      it(`${a} * ${-b} = ${a * -b}`, () => {
        aReg.set(a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg)

        assert.equal(result.numberSigned, a*-b)
      })
      
      it(`${-a} * ${b} = ${-a * b}`, () => {
        aReg.set(-a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg)

        assert.equal(result.numberSigned, -a*b)
      })
      
      it(`${-a} * ${-b} = ${-a * -b}`, () => {
        aReg.set(-a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg)

        assert.equal(result.numberSigned, -a*-b)
      })
    })

    describe("Bute's method", () => {

      const aReg = new Register(4)
      const bReg = new Register(4)
      
      it(`${a} * ${b} = ${a * b}`, () => {
        aReg.set(a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.BUTE_METHOD)

        assert.equal(result.numberSigned, a*b)
      })
      
      it(`${a} * ${-b} = ${a * -b}`, () => {
        aReg.set(a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.BUTE_METHOD)

        assert.equal(result.numberSigned, a*-b)
      })
      
      it(`${-a} * ${b} = ${-a * b}`, () => {
        aReg.set(-a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.BUTE_METHOD)

        assert.equal(result.numberSigned, -a*b)
      })
      
      it(`${-a} * ${-b} = ${-a * -b}`, () => {
        aReg.set(-a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.BUTE_METHOD)

        assert.equal(result.numberSigned, -a*-b)
      })
    })

    describe("Fast 2", () => {

      const aReg = new Register(2)
      const bReg = new Register(2)
      
      it(`${a} * ${b} = ${a * b}`, () => {
        aReg.set(a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        assert.equal(result.numberSigned, a*b)
      })
      
      it(`${a} * ${-b} = ${a * -b}`, () => {
        aReg.set(a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        assert.equal(result.numberSigned, a*-b)
      })
      
      it(`${-a} * ${b} = ${-a * b}`, () => {
        aReg.set(-a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        assert.equal(result.numberSigned, -a*b)
      })
      
      it(`${-a} * ${-b} = ${-a * -b}`, () => {
        aReg.set(-a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        assert.equal(result.numberSigned, -a*-b)
      })
    })
  })

  
})

