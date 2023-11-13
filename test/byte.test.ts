import t from "tap"
import { byte } from "../dist/target/commonjs/index.js";

const Byte = byte.Byte

t.test("Byte", (t) => {
  t.test(`1 + 1 = 2`, (t) => {
    const a = new Byte(1)
    const b = new Byte(1)

    const result = a.add(b)

    t.equal(a.number, 2)
    t.equal(result.result.number, 2)

    t.end()
  })

  t.skip(`144 == not -145`, (t) => {
    const a = new Byte(-145)
    a.not()

    t.equal(a.number, 144)

    t.end()
  })

  t.end()
})