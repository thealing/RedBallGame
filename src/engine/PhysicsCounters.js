class PhysicsCounters {
  constructor() {
    this.reset();
  }

  reset() {
    this.bodies = 0;
    this.colliders = 0;
    this.springs = 0;
    this.joints = 0;
    this.boundingRectsSkipped = 0;
    this.boundingRectsTested = 0;
    this.shapesTested = 0;
    this.collisionsDetected = 0;
    this.collisionsHandled = 0;
    this.stepDuration = 0;
  }
}
