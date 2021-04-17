import {
  QuestionLikert,
  QuestionOptionsLikert
} from './question-likert';
import {
  QuestionNumericValue,
} from './question-numeric';

export const QUESTION_LIKERT_SEVEN_DEFAULT_VALUES: QuestionNumericValue[] = [
  {key: 1, name: 'Täysin eri mieltä'},
  {key: 2, name: ''},
  {key: 3, name: ''},
  {key: 4, name: 'Neutraali'},
  {key: 5, name: ''},
  {key: 6, name: ''},
  {key: 7, name: 'Täysin samaa mieltä'}
];

export class QuestionLikertSeven extends QuestionLikert {

  /*
   * Overrides
   */

  constructor(
    options: QuestionOptionsLikert,
    defaultValues: QuestionNumericValue[] = QUESTION_LIKERT_SEVEN_DEFAULT_VALUES
  ) {
    super(options, defaultValues);
  }

}

