import EventEmitter from "events";

export class ProgressEmitter {
  private progress: number;

  /** >@example
   * ```typescript
   * const e = new EventEmitter();
   * const patties = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   * 
   * const burgers = new ProgressEmitter("burgers", `Cooking burgers`, patties.length, e );
   * 
   * e.on('burgers', (message, percentage) => {
   *  console.log(`${message}`); // Cooking burgers... 25/100
   * })
   * 
   * for (const patty in patties){
   *    burgers.emitProgress();
   *    await cookPatty(patty);
   * }
   * 
   * burgers.closingEmit();
   * ```
   */
  constructor(
    private readonly eventName: string,
    private readonly processAdjective: string,
    private readonly itemsLength: number,
    private e?: EventEmitter
  ) {
    this.progress = 0;
    this.emitProgress();
  }

  public emitProgress() {
    this.progress += 100 / (this.itemsLength + 2);

    this.emit(this.progress);
  }

  public closingEmit() {
    this.emit(100);
  }

  private emit(percentage: number) {
    this.e?.emit(
      this.eventName,
      `${this.processAdjective}... ${Math.round(percentage)}/100`,
      percentage
    );
  }
}
