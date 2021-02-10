import { DataProjector,
         ProjectorData,
         ProjectedMapping } from '..';

import * as tsnejs from './lib/tsne';

export class TsneProjector extends DataProjector {
  private _tsne: any;
  public intervalRef: number;
  public tsneOptions = {
    perplexity: 30,
    epsilon: 10,
    maxChunks: 40,
    stepChunk: 25, // number of steps to complete in one chunk
  };

  constructor() {
    super();
  }

  public get progress(): number {
    // From 0 to 100
    if (this._tsne) {
      return Math.round(100 * this._tsne.iter / (this.tsneOptions.maxChunks * this.tsneOptions.stepChunk));
    } else {
      return 0;
    }
  }

  /*
   * Call to start the mapping process. In the end, this will call finalize to calculate
   * the final positions.
   */
  public project(data: ProjectorData, disableVoter: boolean = false, onUpdate?: (number) => void ): Promise<ProjectedMapping> {

    return new Promise((resolve, reject) => {
      // Create tsne object and initialize
      this._tsne = new tsnejs.tSNE(this.tsneOptions);
      this._tsne.initDataRaw(data);
      // Start calculating
      // TODO: make this nice and async instead of setInterval
      //       couldn't make async work nicely with the spinner
      // Once calculation is done, draw the map
      this.intervalRef = window.setInterval( () => {
        if (this._tsne.iter % 100 === 0 && onUpdate)
          onUpdate(this.progress);
        for (let i = 0; i < this.tsneOptions.stepChunk; i++) {
          this._tsne.step();
          if (this._tsne.iter >= this.tsneOptions.maxChunks * this.tsneOptions.stepChunk) {
            window.clearInterval(this.intervalRef);
            const scaled = this.finalize(this._tsne.getSolution(), disableVoter);
            resolve(scaled);
          }
        }
      }, 1);
    });

  }

}