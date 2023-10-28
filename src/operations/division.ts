import { Bit, Byte } from "../byte";
import { Register, RegisterWithCursor } from "../register/register";
import { IRegisterBinOp, OperandDescription, Step } from "../base";

export const divide: IRegisterBinOp = function divide(dividendInput: Register, dividerInput: Register) {
  // init result and current reminder (dividend may be copied to current reminder)
  const dividend = dividendInput.snapshot()
  const divider = new Register(dividerInput.snapshot().lowHalf)
  const currentReminderBytes = Byte.fill(dividendInput.WIDTH)
  const currentReminder = new RegisterWithCursor(currentReminderBytes).set(dividend.numberSigned)
  const center = Math.floor(currentReminderBytes.length / 2);
  currentReminder.cursorPosition = center
  const result = new Register(currentReminder.lowHalf)
  const reminder = new Register(currentReminder.highHalf)
  
  const steps: Step[] = []

  // check validity of division
  const isCorrect = isDivisionValid(currentReminder, dividend, divider)
  if (!isCorrect) {
    throw new Error("division could not be performed")
  }
  
  // start division
  for (let i = 0; i < Byte.LENGTH - 1; i++) {
    const step = new Step()
    steps.push(step)
    const stepNumber = i + 2
    step.title = `step ${stepNumber}`
    
    // if equal -> subtract
    // if not -> add
    currentReminder.shiftLeft()
    step.operandDescription.push(new OperandDescription(`<-R${stepNumber}`, currentReminder, "сдвинутый текущий остаток"))
    
    if (currentReminder.sign == divider.sign) {
      step.withComments("знаки текущего остатка == знак делителя; производится вычитание")
      const negative = new Register(Byte.fill(divider.WIDTH))
      negative.subtract(divider)
      step.operandDescription.push(new OperandDescription("B[доп]", negative, "делитель в доп коде"))
      reminder.add(negative)
    } else {
      reminder.add(divider)
    }
    
    currentReminder.formatBeauty("current reminder")
    const bit = +(currentReminder.sign == divider.sign) as Bit
    currentReminder.shiftRight(0)
    currentReminder.shiftLeft(bit)
    step.operandDescription.push(new OperandDescription(`R${stepNumber}`, reminder))
  }

  // correction
  if (reminder.sign != dividend.sign) {
    const correctionStep = new Step()
    correctionStep.title = "коррекция"
    steps.push(correctionStep)
    if (reminder.sign == divider.sign) {
      correctionStep.withComments("знак остатка и делителя совпадают")
      reminder.subtract(divider)
    } else {
      reminder.add(divider)
    }

  }

  return {result: [result, reminder], steps}
}

function isDivisionValid(currentReminder: Register, dividendInput: Register, dividerInput: Register): [boolean, Step] {
  // copy registers (they should not be mutated)
  const semiFirstStep = new Step()
  semiFirstStep.title = "пробное вычитание"
  const dividend = dividendInput.snapshot()
  const divider = dividerInput.snapshot()
  const currentReminderHigh = new Register(currentReminder.highHalf)
  
  // if dividend and divider have same signs:
  if (dividend.sign == divider.sign) {
    semiFirstStep.withComments("знаки делимого и делителя одинаковые")
    // left shift dividend by one bit
    currentReminder.shiftLeft()
    semiFirstStep.operandDescription.push(new OperandDescription("<-R", currentReminder))

    currentReminderHigh.subtract(divider)
    semiFirstStep.operandDescription.push(new OperandDescription("R[1]", currentReminder, "после вычитания"))
    // subtract divider from high byte of dividend

  } else { 
    // add divider with low byte of dividend
    currentReminder.add(divider);
    // left shift result by 1 bit
    currentReminder.shiftLeft()
    // add divider with high byte of dividend
    currentReminderHigh.add(divider)
  }

  const firstBit = +(currentReminder.sign == divider.sign) as Bit
  currentReminder.shiftRight()
  currentReminder.shiftLeft(firstBit)
  const step = new Step()
  return dividend.sign != currentReminder.sign

}
