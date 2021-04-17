import {
  Question,
  QuestionOptions
} from './question';

/*
 * For matching functions in matcher and filters
 */

export enum AgreementType {
  Agree,
  Disagree,
  OpinionUnknown,
  MostlyAgree, // Within eg. 1 Likert step
  StronglyDisagree, // More than eg. 1 Likert step away
}

/*
 * The values and their associated labels. If name is undefined,
 * the value itself is used. If it's an empty string, no name is displayed.
 */
export type QuestionNumericValue = {
  key: number,
  name?: string
}

export interface QuestionOptionsNumeric extends QuestionOptions {
  values?: QuestionNumericValue[],
  partyAverages?: {
    [partyId: string]: number | number[]
  }
}

export const QUESTION_NUMERIC_DEFAULT_VALUES: QuestionNumericValue[] = [
  {key: 1},
  {key: 2}, 
  {key: 3}, 
  {key: 4}, 
  {key: 5}
];

/*
 * Base class for numeric question objects
 * Only numeric questions allow for voter answers and party averages
 */

export abstract class QuestionNumeric extends Question {
  public voterAnswer: number | number[];
  public partyAverages: {
    [partyId: string]: number | number[]
  }
  /*
   * These are initialized in the constructor
   */
  readonly values: QuestionNumericValue[];
  readonly maxAnswer: number;
  readonly minAnswer: number;
  readonly neutralAnswer: number;
  /*
   * Convenience getters for AgreementTypes
   */
  static readonly agree: AgreementType = AgreementType.Agree;
  static readonly disagree: AgreementType = AgreementType.Disagree;
  static readonly opinionUnknown: AgreementType = AgreementType.OpinionUnknown;
  static readonly mostlyAgree: AgreementType = AgreementType.MostlyAgree;
  static readonly stronglyDisagree: AgreementType = AgreementType.StronglyDisagree;

  constructor(
    {values, ...options}: QuestionOptionsNumeric,
    defaultValues: QuestionNumericValue[] = QUESTION_NUMERIC_DEFAULT_VALUES
  ) {
    super(options);
    this.partyAverages = options.partyAverages ?? {};
    // Set values and find min and max
    this.values = values || defaultValues;
    const sorted = this.values.sort((a, b) => a.key - b.key);
    this.minAnswer = sorted[0].key;
    this.maxAnswer = sorted[sorted.length - 1].key;
    this.neutralAnswer = sorted[Math.floor(sorted.length / 2)].key;
  }

  get valueKeys(): number[] {
    return this.values.map(v => v.key);
  }

  /*
   * Find a specific value
   * TODO: Convert internal representation to Map
   */
  public getValue(key: number): QuestionNumericValue {
    for (const v of this.values)
      if (v.key === key)
        return v;
    return undefined;
  }

  /*
   * For convenience
   */
  public unsetVoterAnswer(): void {
    this.voterAnswer = undefined;
  }

  /*
   * Override if needed
   */
  public isMissing(value: any): boolean {
    return value == null || isNaN(value);
  }

  /*
   * These are mainly used for storing values in cookies
   * Override if needed.
   */
  public convertAnswerToString(value: number | number[] = this.voterAnswer): string {
    return value.toString();
  }

  public parseAnswerFromString(value: string): number | number[] {
    return Number(value);
  }

  /*
   * Get the maximally distant answer to the one given
   */
  public invertAnswer(value: any, biasedTowardsMax: boolean = true): number {
    return Number(value) <= (biasedTowardsMax ? this.neutralAnswer : this.neutralAnswer - 1) ? this.maxAnswer : this.minAnswer;
  }

  public getInvertedVoterAnswer(biasedTowardsMax?: boolean): number {
    if (this.voterAnswer == null)
      throw new Error(`No voter answer for question '${this.id}'.`);
    return this.invertAnswer(this.voterAnswer, biasedTowardsMax);
  }

  /*
   * Calc distance between two values
   * NB. If one of the values is missing, it's treated as inverted
   */
  public getDistance(value1: any, value2: any): number {
    if (this.isMissing(value1) && this.isMissing(value2)) {
      throw new Error("Both values to getDistance cannot be missing!");
    } else {
      return Math.abs(
        Number(this.isMissing(value1) ? this.invertAnswer(value2) : value1) -
        Number(this.isMissing(value2) ? this.invertAnswer(value1) : value2)
      );
    }
  }

  /*
   * Match to values and get their AgreementType
   */
  public match(value1: any, value2: any, strict: boolean = false, allowOpinionUnknown: boolean = true): AgreementType {
    
    if (allowOpinionUnknown && value1 == null) {
      return AgreementType.OpinionUnknown;
    }

    const dist = this.getDistance(value1, value2);

    if (strict) {
      return dist === 0 ? AgreementType.Agree: AgreementType.Disagree;
    }

    switch (dist) {
      case 0:
      case 1:
        return AgreementType.MostlyAgree;
      default:
        return AgreementType.StronglyDisagree;
    }
  }

  /*
    * Convenience wrappers for match
    */
  public doMatchAgreementType(value1: any, value2: any, type: AgreementType): boolean {
    switch (type) {
      case AgreementType.Agree:
        return this.doAgree(value1, value2);
      case AgreementType.Disagree:
        return this.doDisagree(value1, value2);
      case AgreementType.MostlyAgree:
        return this.doMostlyAgree(value1, value2);
      case AgreementType.StronglyDisagree:
        return this.doStronglyDisagree(value1, value2);
      case AgreementType.OpinionUnknown:
        return this.doHaveOpinionUnknown(value1);
    }
  }

  public doAgree(value1: any, value2: any): boolean {
    return this.match(value1, value2, true) === AgreementType.Agree;
  }

  public doDisagree(value1: any, value2: any): boolean {
    return this.match(value1, value2, true) === AgreementType.Disagree;
  }

  public doMostlyAgree(value1: any, value2: any): boolean {
    return this.match(value1, value2, false) === AgreementType.MostlyAgree;
  }

  public doStronglyDisagree(value1: any, value2: any): boolean {
    return this.match(value1, value2, false) === AgreementType.StronglyDisagree;
  }

  public doHaveOpinionUnknown(value1: any, value2: any = null): boolean {
    return this.match(value1, value2, false) === AgreementType.OpinionUnknown;
  }
}