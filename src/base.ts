import { Register, ISnapshotable } from "./register/register";

type TResult = Register

export interface IRegisterBinOp {
  (a: Register, b: Register): IResult
}

export interface IResult {
  /**
   * Steps taken to preform computation
   */
  steps: Step[]
  /**
   * Registers holding results.
   * May be multiple register as for division
   */
  result: TResult[]
}

/**
 * Represent single step in algorithm.
 *  
 */
export class Step {
  /**
   * Contains snapshot of state of relevant operands right after computation
   */
  public operandDescription: OperandDescription<Register>[]
  /** 
   * Shown before step body.
   * 
   * Use for clarifications on a step if required
   */
  public comments: TComment[] = []

  /**
   * Title of step.
   * 
   * Usually contains string `Step ${step_number}`
   */
  public title: string | null = null
  /** Last operand description is considered as intermediate result */
  constructor({title, operandDescription = []}: { title?: string, operandDescription?: OperandDescription<Register>[] } = {}) {
    this.operandDescription = operandDescription
    this.title = title ?? null;
  }

  withComments(...comments: TComment[]) {
    this.comments = this.comments.concat(comments)
    return this
  }
}

export type TComment = string

export type TPresentationFunction<T> = (this: OperandDescription<T>) => void

/**
 * Creates snapshot of data.
 */
export class OperandDescription<T> {
  public data: T

  /**
   * 
   * @param operandName example: СЧП, М (Мантисса)
   * @param comment example: модифицированный сдвиг СЧП и множителя вправо
   */
  constructor(public operandName: string, data: ISnapshotable<T>, public comment: string = "") {
    this.data = data.snapshot()
  }
}