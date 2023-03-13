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

      it("0x98 * 0x1ec = 0x12420", () => {
        aReg.set(0x98)
        bReg.set(0x1ec)

        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        assert.equal(result.numberSigned, 0x12420)
      })

      it(`0x100 * 0x100 = ${0x100 * 0x100}`, () => {
        aReg.set(0x100)
        bReg.set(0x100)

        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        assert.equal(result.numberSigned, 0x100*0x100)
      })

      
    })

    describe("Fast 4", () => {

      const aReg = new Register(4)
      const bReg = new Register(4)
      
      it(`${a} * ${b} = ${a * b}`, () => {
        aReg.set(a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        assert.equal(result.numberSigned, a*b)
      })
      
      it(`${a} * ${-b} = ${a * -b}`, () => {
        aReg.set(a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        assert.equal(result.numberSigned, a*-b)
      })
      
      it(`${-a} * ${b} = ${-a * b}`, () => {
        aReg.set(-a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        assert.equal(result.numberSigned, -a*b)
      })
      
      it(`${-a} * ${-b} = ${-a * -b}`, () => {
        aReg.set(-a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        assert.equal(result.numberSigned, -a*-b)
      })

      it("0x98 * 0x1ec = 0x12420", () => {
        aReg.set(0x98)
        bReg.set(0x1ec)

        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        assert.equal(result.numberSigned, 0x12420)
      })

      it(`0x100 * 0x100 = ${0x100 * 0x100}`, () => {
        aReg.set(0x100)
        bReg.set(0x100)

        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        assert.equal(result.numberSigned, 0x100*0x100)
      })

      
    })
    
  })

  describe("division", () => {
    const aReg = new Register(2)
    const bReg = new Register(2)

    it("1916 / 26 = 73; reminder = 18", () => {
      aReg.set(1916)
      bReg.set(26)

      const [result, reminder] = Register.divide(aReg, bReg)

      assert.equal(result.numberSigned, 73)
      assert.equal(reminder.numberSigned, 18)
    })

    it("-1916 / 26 = -73; reminder = -18", () => {
      aReg.set(-1916)
      bReg.set(26)

      const [result, reminder] = Register.divide(aReg, bReg)

      assert.equal(result.numberSigned, -73)
      assert.equal(reminder.numberSigned, -18)
    })

    it("-27 / 5 = -5; reminder = -2", () => {
      aReg.set(-27)
      bReg.set(5)

      const [result, reminder] = Register.divide(aReg, bReg)

      assert.equal(result.numberSigned, -5)
      assert.equal(reminder.numberSigned, -2)
    })
  })
  
})

