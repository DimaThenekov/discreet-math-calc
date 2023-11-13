import { Bit, Byte } from "../byte.js";
import { Register, RegisterWithCursor } from "../register/register.js";
import { IRegisterBinOp, OperandDescription, Step } from "../base.js";

export const divide: IRegisterBinOp = function divide(dividendInput: Register, dividerInput: Register) {
  // init result and current reminder (dividend may be copied to current reminder)
  const dividend = dividendInput.snapshot()
  const divider = new Register(dividerInput.snapshot().lowHalf)
  const currentReminderBytes = Byte.fill(dividendInput.WIDTH)
  const currentReminder = new RegisterWithCursor(currentReminderBytes).set(dividend.numberSigned)
  const center = Math.floor(currentReminderBytes.length / 2);
  currentReminder.cursorPosition = center * Byte.LENGTH
  const result = new Register(currentReminder.lowHalf)
  const reminder = new Register(currentReminder.highHalf)
  
  const steps: Step[] = []

  // check validity of division
  const isCorrect = isDivisionValid(currentReminder, dividend, divider)
  if (!isCorrect[0]) {
    throw new Error("division could not be performed")
  }

  steps.push(isCorrect[1])
  
  // start division
  for (let i = 0; i < Byte.LENGTH * (dividend.WIDTH / 2) - 1; i++) {
    const stepNumber = i + 2
    const step = new Step({title: `step ${stepNumber}`})
    steps.push(step)
    
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
    const correctionStep = new Step({title: "коррекция"})
    // currentReminder.shiftLeft()

    if (reminder.sign == divider.sign) {
      const subtraction = new Register(Byte.fill(divider.WIDTH)).set(0)
      subtraction.subtract(divider)
      correctionStep.withComments("знак остатка и делителя совпадают")
      correctionStep.operandDescription.push(new OperandDescription("B", subtraction, "вычитаем делитель из остатка"))
      reminder.subtract(divider)
    } else {
      correctionStep.withComments("знак остатка и делителя различаются - сложение")
      correctionStep.operandDescription.push(new OperandDescription("B", divider, "прибавляем делитель к остатку"))
      reminder.add(divider)
    }

    correctionStep.operandDescription.push(new OperandDescription("Остаток", reminder, "остаток после применения коррекции"))
    steps.push(correctionStep)
  }

  return {result: [result, reminder], steps}
}

function isDivisionValid(currentReminder: Register, dividendInput: Register, dividerInput: Register): [boolean, Step] {
  // copy registers (they should not be mutated)
  const semiFirstStep = new Step({ title: "пробное вычитание/сложение" })
  const dividend = dividendInput.snapshot()
  const divider = dividerInput.snapshot()
  const currentReminderHigh = new Register(currentReminder.highHalf)
  
  // if dividend and divider have same signs:
  if (dividend.sign == divider.sign) {
    semiFirstStep.withComments("знаки делимого и делителя одинаковые")
    // left shift dividend by one bit
    currentReminder.shiftLeft()
    semiFirstStep.operandDescription.push(new OperandDescription("<-R", currentReminder))
    const BLow = new Register(Byte.fill(divider.WIDTH)).set(0)
    BLow.subtract(divider)

    semiFirstStep.operandDescription.push(new OperandDescription("B[доп]", BLow))
    currentReminderHigh.subtract(divider)
    semiFirstStep.operandDescription.push(new OperandDescription("R[1]", currentReminder, "после вычитания"))
    // subtract divider from high byte of dividend
  } else {
    semiFirstStep.withComments("знаки делимого и делителя разные")
    // add divider with low byte of dividend
    const BLow = new Register(Byte.fill(divider.WIDTH * 2)).set(0)
    BLow.add(divider)
    semiFirstStep.operandDescription.push(new OperandDescription("B[пр]", BLow));
    currentReminder.add(divider);
    semiFirstStep.operandDescription.push(new OperandDescription("R[1]", currentReminder));
    // left shift result by 1 bit
    currentReminder.shiftLeft()
    semiFirstStep.operandDescription.push(new OperandDescription("<-R", currentReminder));
    // add divider with high byte of dividend
    semiFirstStep.operandDescription.push(new OperandDescription("B[пр]", divider))
    currentReminderHigh.add(divider)
    semiFirstStep.operandDescription.push(new OperandDescription("R[1]", currentReminder))
  }
  const firstBit = +(currentReminder.sign == divider.sign) as Bit
  currentReminder.shiftRight()
  currentReminder.shiftLeft(firstBit)
  return [dividend.sign != currentReminder.sign, semiFirstStep]
}

// const aBytes = Byte.fill(2)
// const bBytes = Byte.fill(2)

// const a = new Register(aBytes).set(1916)
// const b = new Register(bBytes).set(-26)
// const result = divide(a, b)

// console.dir(result.steps, {
//   depth: 5,
// })

// console.log(result.result[0].formatBeauty("result"))
// console.log(result.result[1].formatBeauty("reminder"))

  
