import { cloneDeep } from "lodash";
import { Byte } from "../byte";
import { Register, RegisterWithCursor } from "../register/register";
import { IRegisterBinOp, IResult, OperandDescription, Step, TComment } from "../base";

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

export const multiplyWithCorrection: IRegisterBinOp = function multiplyWithCorrection(a: Register, b: Register) {
  const resultBytes: Byte[] = []
  for (let i = 0; i < a.WIDTH * 2; i++) {
    resultBytes.push(new Byte())
  }
  const center = Math.floor(resultBytes.length / 2)
  const result = new RegisterWithCursor(resultBytes);
  result.cursorPosition = center * Byte.LENGTH
  const resultLow = new Register(result.lowHalf)
  const resultHigh = new Register(result.highHalf)
  
  resultLow.set(b.number)

  const steps: Step[] = []
  for (let i = 0; i < Byte.LENGTH * b.WIDTH; i++) {
    const step = new Step()
    
    const stepIndex = i+1
    const resultName = `R[${stepIndex}]`
    step.title = "step " + stepIndex
    
    if (result.getBit(0) == EAction.ADD_SHIFT) {
      step.operandDescription.push(new OperandDescription("A[пр]", a))
      resultHigh.add(a)
      step.operandDescription.push(new OperandDescription(resultName, result))
      result.shiftRight(a.sign)
      step.operandDescription.push(new OperandDescription(`->${resultName}`, result, "модифицированный сдвиг СЧП и множителя вправо"))
    } else {
      result.shiftRight()
      step.operandDescription.push(new OperandDescription(`->${resultName}`, result, "просто сдвиг (в старший разряд вносится 0)"))
    }

    steps.push(step)
  }

  if (b.sign) {
    const {steps: correctionSteps} =  correction(result, a);
    steps.push(...correctionSteps)
  }

  return {result: [result], steps}
}

function correction(result: Register, multiplicand: Register): IResult {
  const correction = cloneDeep(multiplicand).set(-multiplicand.number)
  
  const step = new Step(new OperandDescription("C", correction, "число на которое корректируем. -1 * на множитель"))
  step.title = "correction"

  const resultHigh = new Register(result.highHalf)
  resultHigh.add(correction)
  step.operandDescription.push(new OperandDescription("R[c]", result, "скорректированный результат"))

  return {result: [result], steps: [step]}
}

