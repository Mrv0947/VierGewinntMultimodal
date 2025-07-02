export class Point {
  constructor(x: number, y: number);
  X: number;
  Y: number;
}

export class DollarRecognizer {
  constructor();
  Recognize(points: Point[], useProtractor: boolean): { Name: string; Score: number; Time: number };
  AddGesture(name: string, points: Point[]): number;
  DeleteUserGestures(): number;
}
