import t from "tap"
import { byte, divide, multiplyBute, multiplyWithCorrection, register } from "../dist/target/commonjs/index";

const Byte = byte.Byte
const Register = register.Register

console.log = () => {}
t.test("Register", (t) => {
  const a = 88
  const b = 36
  
  t.test("addition", (t) => {
    const aBytes = [new Byte(0), new Byte(0)]
    const bBytes = [new Byte(0), new Byte(0)]
    const aReg = new Register(aBytes)
    const bReg = new Register(bBytes)

    t.test(`${a} + ${b} = ${a + b}`, (t) => {
      aReg.set(a)
      bReg.set(b)

      aReg.add(bReg)

      t.same(aReg.numberSigned, a + b)
      t.end()
    })

    t.test(`${a} + (${-b}) = ${a - b}`, (t) => {
      aReg.set(a)
      bReg.set(-b)
      
      aReg.add(bReg)

      t.same(aReg.numberSigned, a - b)
      t.end()
    })

    t.test(`(${-a}) + ${b} = ${-a + b}`, (t) => {
      aReg.set(-a)
      bReg.set(b)

      aReg.add(bReg)

      t.same(aReg.numberSigned, -a + b)
      t.end()
    })

    t.test(`(${-a}) + ${-b} = ${-a + -b}`, (t) => {
      aReg.set(-a)
      bReg.set(-b)

      aReg.add(bReg)

      t.same(aReg.numberSigned < 0, true, "should be negative")
      t.same(aReg.numberSigned, -a - b)
      t.end()
    })

    t.test(`${-b} + ${-a} = ${-b - a}`, (t) => {
      aReg.set(-a)
      bReg.set(-b)

      bReg.add(aReg)

      t.same(bReg.numberSigned, -b - a)
      t.end()
    })

    t.test("overflow", (t) => {
      aReg.set(2**16 - 1)
      bReg.set(1)
      const overflow = aReg.add(bReg)

      t.same(overflow, 1)
      t.end()
    })

    t.test("0 + 0 = 0", (t) => {
      aReg.set(0)
      bReg.set(0)

      aReg.add(bReg)

      t.same(aReg.numberSigned, 0)
      t.end()
    })

    t.test("0 - 1 = -1", (t) => {
      aReg.set(0)
      bReg.set(-1)

      aReg.add(bReg)

      t.same(aReg.numberSigned, -1)
      t.end()
    })

    t.test("add high", (t) => {
      aReg.set(14080)
      bReg.set(55)
      const aRegHigh = new Register(aBytes.slice(0, 1))
      const bRegLow = new Register(bBytes.slice(-1))

      aRegHigh.add(bRegLow)

      t.same(aReg.numberSigned, 28160)
      t.end()
    })

    t.end()
  })

   t.test("subtract", (t) => {
    const aBytes = [new Byte(0), new Byte(0)]
    const bBytes = [new Byte(0), new Byte(0)]
    const aReg = new Register(aBytes)
    const bReg = new Register(bBytes)

    t.test(`${a} - ${b} = ${a - b}`, (t) => {
      aReg.set(a)
      bReg.set(b)

      aReg.subtract(bReg)

      t.same(aReg.numberSigned, a - b)
      t.end()
    })

    t.test(`${-a} - ${b} = ${-a - b}`, (t) => {
      aReg.set(-a)
      bReg.set(b)

      aReg.subtract(bReg)

      t.same(aReg.numberSigned, -a -b)
      t.end()
    })

    t.end()
  })


  t.test("shift", (t) => {
    const aBytes = [new Byte(0), new Byte(0)]
    const aReg = new Register(aBytes)

    t.test("shift right", (t) => {
      const number = -0b111001011
      aReg.set(number)
      
      const shiftedBit = aReg.shiftRight()

      t.same(shiftedBit, 1)
      t.same(aReg.numberSigned, number >> 1)
      t.end()
    })

    t.end()
  })


  t.test("multiplication, 2 bytes result", (t) => {
    const aBytes = [new Byte(0)]
    const bBytes = [new Byte(0)]
    const aReg = new Register(aBytes)
    const bReg = new Register(bBytes)

    t.test("with correction", (t) => {
      
      t.test(`${a} * ${b} = ${a * b}`, (t) => {
        aReg.set(a)
        bReg.set(b)
        
        const result = multiplyWithCorrection(aReg, bReg)

        t.same(result.result[0].numberSigned, a*b)
        t.end()
      })
      
      t.test(`${a} * ${-b} = ${a * -b}`, (t) => {
        aReg.set(a)
        bReg.set(-b)
        
        const result = multiplyWithCorrection(aReg, bReg)

        t.same(result.result[0].numberSigned, a*-b)
        t.end()
      })
      
      t.test(`${-a} * ${b} = ${-a * b}`, (t) => {
        aReg.set(-a)
        bReg.set(b)
        
        const result = multiplyWithCorrection(aReg, bReg)

        t.same(result.result[0].numberSigned, -a*b)
        t.end()
      })
      
      t.test(`${-a} * ${-b} = ${-a * -b}`, (t) => {
        aReg.set(-a)
        bReg.set(-b)
        
        const result = multiplyWithCorrection(aReg, bReg)

        t.same(result.result[0].numberSigned, -a*-b)
        t.end()
      })

      t.end()
    })

     t.test("Bute's method", (t) => {
      
      t.test(`${a} * ${b} = ${a * b}`, (t) => {
        aReg.set(a)
        bReg.set(b)
        
        const result = multiplyBute(aReg, bReg)

        t.same(result.result[0].numberSigned, (a*b))
        t.end()
      })
      
      t.test(`${a} * ${-b} = ${a * -b}`, (t) => {
        aReg.set(a)
        bReg.set(-b)
        
        const result = multiplyBute(aReg, bReg)

        t.same(result.result[0].numberSigned, a*-b)
        t.end()
      })
      
      t.test(`${-a} * ${b} = ${-a * b}`, (t) => {
        aReg.set(-a)
        bReg.set(b)
        
        const result = multiplyBute(aReg, bReg)

        t.same(result.result[0].numberSigned, -a*b)
        t.end()
      })
      
      t.test(`${-a} * ${-b} = ${-a * -b}`, (t) => {
        aReg.set(-a)
        bReg.set(-b)
        
        const result = multiplyBute(aReg, bReg)

        t.same(result.result[0].numberSigned, -a*-b)
        t.end()
      })

      t.end()
    })
/*
    t.test("Fast 2", (t) => {

      const aReg = new Register(2)
      const bReg = new Register(2)
      
      t.test(`${a} * ${b} = ${a * b}`, (t) => {
        aReg.set(a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        t.same(result.numberSigned, a*b)
      })
      
      t.test(`${a} * ${-b} = ${a * -b}`, (t) => {
        aReg.set(a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        t.same(result.numberSigned, a*-b)
      })
      
      t.test(`${-a} * ${b} = ${-a * b}`, (t) => {
        aReg.set(-a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        t.same(result.numberSigned, -a*b)
      })
      
      t.test(`${-a} * ${-b} = ${-a * -b}`, (t) => {
        aReg.set(-a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        t.same(result.numberSigned, -a*-b)
      })

      t.test("0x98 * 0x1ec = 0x12420", (t) => {
        aReg.set(0x98)
        bReg.set(0x1ec)

        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        t.same(result.numberSigned, 0x12420)
      })

      t.test(`0x100 * 0x100 = ${0x100 * 0x100}`, (t) => {
        aReg.set(0x100)
        bReg.set(0x100)

        const result = Register.multiply(aReg, bReg, EMethod.FAST_2)

        t.same(result.numberSigned, 0x100*0x100)
      })

      
    })

    t.test("Fast 4", (t) => {

      const aReg = new Register(4)
      const bReg = new Register(4)
      
      t.test(`${a} * ${b} = ${a * b}`, (t) => {
        aReg.set(a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        t.same(result.numberSigned, a*b)
      })
      
      t.test(`${a} * ${-b} = ${a * -b}`, (t) => {
        aReg.set(a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        t.same(result.numberSigned, a*-b)
      })
      
      t.test(`${-a} * ${b} = ${-a * b}`, (t) => {
        aReg.set(-a)
        bReg.set(b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        t.same(result.numberSigned, -a*b)
      })
      
      t.test(`${-a} * ${-b} = ${-a * -b}`, (t) => {
        aReg.set(-a)
        bReg.set(-b)
        
        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        t.same(result.numberSigned, -a*-b)
      })

      t.test("0x98 * 0x1ec = 0x12420", (t) => {
        aReg.set(0x98)
        bReg.set(0x1ec)

        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        t.same(result.numberSigned, 0x12420)
      })

      t.test(`0x100 * 0x100 = ${0x100 * 0x100}`, (t) => {
        aReg.set(0x100)
        bReg.set(0x100)

        const result = Register.multiply(aReg, bReg, EMethod.FAST_4)

        t.same(result.numberSigned, 0x100*0x100)
      })

      
    }) */
    

    t.end()
  })

  t.test("division", (t) => {
    const aReg = new Register(Byte.fill(2))
    const bReg = new Register(Byte.fill(2))

    t.test("1911 / 91 = 21; reminder = 0", (t) => {
      const aReg = new Register(Byte.fill(4))
      const bREg = new Register(Byte.fill(2))
      aReg.set(1911)
      bReg.set(91)

      const [result, reminder] = divide(aReg, bReg).result

      t.same(result.numberSigned, 21)
      t.same(reminder.numberSigned, 0)
      t.end()
    })

    t.test("1916 / 26 = 73; reminder = 18", (t) => {
      aReg.set(1916)
      bReg.set(26)

      const [result, reminder] = divide(aReg, bReg).result

      t.same(result.numberSigned, 73)
      t.same(reminder.numberSigned, 18)
      t.end()
    })

    t.test("-1916 / 26 = -73; reminder = -18", (t) => {
      aReg.set(-1916)
      bReg.set(26)

      const [result, reminder] = divide(aReg, bReg).result

      t.same(result.numberSigned, -73)
      t.same(reminder.numberSigned, -18)
      t.end()
    })

    t.test("-27 / 5 = -5; reminder = -2", (t) => {
      aReg.set(-27)
      bReg.set(5)

      const [result, reminder] = divide(aReg, bReg).result

      t.same(result.numberSigned, -5)
      t.same(reminder.numberSigned, -2)
      t.end()
    })

    t.end()
  })

  t.end()
})

