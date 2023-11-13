/* import assert from "assert";
import { describe, it } from "mocha";

import { Mantissa } from "../src/mantissa";

describe("floats", () => {
  
  describe("mantissa", () => {

    describe("Format 1", () => {
      it("construction", () => {
        const a = new Mantissa(0xf05)
        const b = new Mantissa(0x5)

        assert.equal(a.number, 0xf05)
        assert.equal(b.number, 0x500)
      })

      it("shift right", () => {
        const b = new Mantissa(0x5).shiftRight().shiftRight()

        assert.equal(b.number, 0x5)

      })

      it("add normalized", () => {
        const a = new Mantissa(0x905)
        const b = new Mantissa(0x5)

        const carryOut = a.add(b)
        assert.strictEqual(carryOut, 0, "should not carry out")
        assert.equal(a.number, 0xe05)
      })

      it("add overflow", () => {
        const a = new Mantissa(0xf0c)
        const b = new Mantissa(0xf)

        const carryOut = a.add(b)

        assert.strictEqual(carryOut, 1)
      })

      it("add denormalized", () => {
        const a = new Mantissa(0xf0c)
        const b = new Mantissa(0x5).shiftRight().shiftRight()

        const carryOut = a.add(b)

        assert.strictEqual(carryOut, 0, "should not carry out")
        assert.equal(a.number, 0xf11)
      })

      it("subtract normalized", () => {
        const a = new Mantissa(0xf05)
        const b = new Mantissa(0xf)

        const carryOut = a.subtract(b)
        assert.strictEqual(carryOut, 0, "should not carry out")
        assert.equal(a.number, 0x5)
      })

      it("subtract denormalized", () => {
        const a = new Mantissa(0xf05)
        const b = new Mantissa(0x5).shiftRight().shiftRight()

        const carryOut = a.subtract(b)

        assert.strictEqual(carryOut, 0, "should not carry out")
        assert.equal(a.number, 0xf00)
      })

      it("subtract overflow", () => {
        const a = new Mantissa(0xe0c)
        const b = new Mantissa(0xf)

        const carryOut = a.add(b)

        assert.strictEqual(carryOut, 1)
      })

      it("normalize", () => {
        const a = new Mantissa(0x5).shiftRight().shiftRight()
        const correction = a.normalize()

        assert.strictEqual(correction, 2)
        assert.equal(a.number, 0x500)
      })
    })

  })

}) */