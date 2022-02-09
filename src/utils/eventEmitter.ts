import EventEmitter from "events";

/** returns EventEmitter to be used with other functions, 
 * which will log every response to the console */
export function createEventLogger() {
  const e = new EventEmitter();

  e.setMaxListeners(10);

  e.on("start", (message, filename) => {
    console.log(message);
  });

  e.on("benchmark_raster", (message, benchmarkSeconds) => {
    console.log(message);
  });

  e.on("benchmark_render", (message, benchmarkSeconds) => {
    console.log(message);
  });

  e.on("progress_raster", (message, progress) => {
    console.log(message);
  });

  e.on("progress_render", (message, progress) => {
    console.log(message);
  });

  e.on("benchmark_total", (message, benchmarkSeconds) => {
    console.log(message);
  });

  e.on("end", (message, videoFilename, videoPath) => {
    console.log(message);
  });

  return e;
}
