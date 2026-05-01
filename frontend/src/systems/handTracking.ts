import { Hands, Results } from '@mediapipe/hands';

export class HandTracking {
  private hands: Hands;
  private onResults: (results: Results) => void;

  constructor(onResults: (results: Results) => void) {
    this.onResults = onResults;
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    this.hands.onResults(this.onResults);
  }

  public async send(image: HTMLVideoElement | HTMLCanvasElement) {
    await this.hands.send({ image });
  }

  public close() {
    this.hands.close();
  }
}
