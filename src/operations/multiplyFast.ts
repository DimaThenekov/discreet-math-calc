import { Bit, Byte } from "../byte"
import { Register } from "../register/register"
import { IRegisterBinOp, OperandDescription, Step } from "../base"

export const multiplyFast2: IRegisterBinOp = function multiplyFast2(a: Register, b: Register) {
  const result = a.snapshot().set(0)

  let correction: Bit = 0
  let action = 0
  const steps: Step[] = []
  for (let i = 0; i < (Byte.LENGTH * b.WIDTH) / 2; i++ ) {
    const currentStep = new Step({title: `Step ${i + 1}`})
    
    action = new Byte(b.getByte(0).sliceNumber(6) + correction).sliceNumber(6)
    b.shiftRight()
    b.shiftRight()

    // console.log(`action ${action.toString(2)} ${correction}:`)
    currentStep.withComments(`action ${action.toString}; correction: ${correction}`)

    switch (action) {
      case 0b00:
        break;
      case 0b01:
        shiftAddAction(result, a, false, 0)
        break;
      case 0b10:
        shiftAddAction(result, a, false, 1)
        break;
      case 0b11:
        shiftAddAction(result, a, true, 0)
        break;
    }

    currentStep.operandDescription.push(new OperandDescription("СЧП", result))

    result.shiftRight()
    result.shiftRight()

    currentStep.operandDescription.push(new OperandDescription("СЧП->2", result))

    correction = +(action == 3 || (action == 0 && correction == 1)) as Bit
    steps.push(currentStep)
  }

  // correction for last step
  if (action == 1) {
    const correctionStep = new Step({title: "Коррекция"})
    correctionStep.operandDescription.push(new OperandDescription("А", a))
    // create view over high half of result byte storage
    const resultHighHalf = new Register(result.highHalf);
    // result is wider than operands exactly in a half
    resultHighHalf.add(a)
    correctionStep.operandDescription.push(new OperandDescription("СЧП", result))
  }
  
  return {result: [result], steps}
}

/* export const multiplyFast4: IRegisterBinOp = function multiplyFast4(a: Register, b: Register) {
  const result = a.snapshot().set(0)

  let correction: Bit = 0
  let internalCorrection: Bit = 0


  let actionLow = 0
  let actionHigh = 0
  for (let i = 0; i < (Byte.LENGTH * b.WIDTH) / 4; i++ ) {
    console.log(`---------------------step ${i + 1}---------------------`)
    
    const actionByteWithCorrection = b.getByte(0)!.sliceToByte(4, 8, true).add(new Byte(correction))[1]
    const actionByteWithCorrectionTruncated = actionByteWithCorrection.sliceToByte(4, 8, true)
    actionLow = actionByteWithCorrectionTruncated.sliceNumber(6,8, true)
    internalCorrection = +(actionLow == 0b11) as Bit
    
    actionHigh = (actionByteWithCorrectionTruncated.sliceNumber(4, 6, true) + internalCorrection) & 0b11
    
    console.log(actionHigh.toString(2).padStart(2, "0") + actionLow.toString(2).padStart(2, "0"))

    correction = +(actionByteWithCorrection.number >= 0b1011) as Bit

    b.shiftRight()
    b.shiftRight()
    b.shiftRight()
    b.shiftRight()

    console.log(`actionLow ${actionLow.toString(2)} ${correction}:`)

    switch (actionLow) {
      case 0b00:
        break;
      case 0b01:
        shiftAddAction(result, a, false, 0)
        break;
      case 0b10:
        shiftAddAction(result, a, false, 1)
        break;
      case 0b11:
        shiftAddAction(result, a, true, 0)
        break;
    }

    console.log(`actionHigh ${actionHigh.toString(2)} ${internalCorrection}:`)

    switch ((actionHigh) & 0b11) {
      case 0b00:
        break;
      case 0b01:
        shiftAddAction(result, a, false, 2)
        break;
      case 0b10:
        shiftAddAction(result, a, false, 3)
        break;
      case 0b11:
        shiftAddAction(result, a, true, 2)
        break;
    }

    result.shiftRight()
    result.shiftRight()
    result.shiftRight()
    result.shiftRight()


    Register.printBeauty(result, "shifted           ")

  }

  if (actionLow == 1) {
    result.addHigh(a)
  }

  return result
} */

function shiftAddAction(result: Register, a: Register, negative: boolean, shiftBy: number) {
  // to display subtracted value in clear way
  const add = new Register(Byte.fill(a.WIDTH)).set(0)
  if (negative) {
    add.subtract(a)
  } else {
    add.add(a)
  }

  for (let i = 0; i < shiftBy; i++) {
    add.shiftLeft()
  }
  const actionName = negative ? "subtract" : "add"
  // const resultName = negative ? "subtraction" : "addition"

  const operandDescriptions: OperandDescription<Register>[] = []
  operandDescriptions.push(new OperandDescription("А", add, `shift left ${shiftBy != 1 ? shiftBy + " " : ""}and ${actionName}`))
  // for 12 bit operands 32 bits result is required
  const resultHighHalf = new Register(result.highHalf)
  const addLowHalf = new Register(add.lowHalf)
  resultHighHalf.add(addLowHalf)
  return result
}

const aBytes = Byte.fill(4)
const bBytes = Byte.fill(2)

const a = new Register(aBytes).set(0x980)
const b = new Register(bBytes).set(0x1ec)
const result = multiplyFast2(a, b)

console.log(result.result[0].formatBeauty("result"))

