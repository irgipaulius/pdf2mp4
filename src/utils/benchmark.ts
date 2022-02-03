import { EventEmitter } from "events";

export class BenchmarkEmitter {
  private readonly startTime: number;

  /** >@example
   * ```typescript
   * const e = new EventEmitter();
   *
   * const cook = new BenchmarkEmitter("cooking_benchmark", "cooking", e);
   * await cookBurger()
   * cook.emitBenchmark();
   *
   * e.on('cooking_benchmark', (message, seconds) => {
   *  console.log(`${message} That's ${seconds / 3600} hours!`);
   *  // Finished cooking in 20 seconds. That's 0.0055555555 hours!
   * })
   * ```
   */
  constructor(
    private readonly eventName: string,
    private readonly processAdjective: string,
    private e?: EventEmitter
  ) {
    this.startTime = Date.now();
  }

  public emitBenchmark() {
    if (!this.e) {
      return;
    }

    const endTime = Date.now();
    const totalBenchmark = (endTime - this.startTime) / 1000;
    this.e?.emit(
      this.eventName,
      `Finished ${this.processAdjective} in ${totalBenchmark} seconds.`,
      totalBenchmark
    );
  }
}
