import * as HandsNS from '@mediapipe/hands';
// @ts-ignore
const Hands = (HandsNS as any).Hands || (HandsNS as any).default?.Hands || HandsNS;

export class HandTracking {
  private hands: any;
  private onResults: (results: any) => void;

  constructor(onResults: (results: any) => void) {
    this.onResults = onResults;
    this.hands = new Hands({
      locateFile: (file: string) => {
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
