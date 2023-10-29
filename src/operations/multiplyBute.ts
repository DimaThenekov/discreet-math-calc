import { Bit, Byte } from "../byte";
import { Register, RegisterWithCursor } from "../register/register";
import { IRegisterBinOp, OperandDescription, Step } from "../base";

export const multiplyBute: IRegisterBinOp = function multiplyBute(
  a: Register,
  b: Register
) {
  const resultBytes = [new Byte(), new Byte()];
  const center = Math.floor(resultBytes.length / 2);
  const result = new RegisterWithCursor(resultBytes);
  result.cursorPosition = center * Byte.LENGTH;
  const resultHigh = new Register(result.highHalf);
  const resultLow = new Register(result.lowHalf).set(b.number);

  let lastShift: Bit = 0;
  const steps: Step[] = [];

  for (let i = 0; i < Byte.LENGTH * b.WIDTH; i++) {
    const step = new Step();
    steps.push(step)
    const stepNumber = i + 1;
    step.title = "step " + stepNumber;
    // 1 -> 0  +++ shift
    // 0 -> 1  --- shift
    // if does not changed: shift
    const currentShift = result.getBit(0);
    step.withComments(
      `текущий бит ${currentShift} --- ${lastShift} предыдущий бит`
    );
    if (lastShift != 
      currentShift) {
      step.withComments(`биты выше разные`);
      if (lastShift) {
        step.operandDescription.push(
          new OperandDescription(
            "A[пр]",
            a,
            "складываем со старшими разрядами СЧП"
          )
        );
        resultHigh.add(a);
      } else {
        step.operandDescription.push(new OperandDescription("A[доп]", a, "вычитаем из старших разрядов СЧП"));
        resultHigh.subtract(a);
      }
      step.operandDescription.push(
        new OperandDescription(
          `R${stepNumber}`,
          result,
          "результат перед сдвигом"
        )
      );
    }

    console.log("shifting");
    result.shiftRight();
    step.operandDescription.push(
      new OperandDescription(`->R${stepNumber}}`, result, "сдвинутый СЧП")
    );

    lastShift = currentShift;
    
  }
  return { steps, result: [result] };
};
