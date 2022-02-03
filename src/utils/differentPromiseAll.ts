import _ from "lodash";

/** executes promises `chunkSize` at the time */
export async function chunkedPromiseAll<ReturnType>(
  promises: (() => Promise<ReturnType>)[],
  chunkSize: number
): Promise<ReturnType[]> {
  const chunks = _.chunk(promises, chunkSize);
  let results: ReturnType[] = [];
  for (const chunk of chunks) {
    const result = await Promise.all(chunk.map((promise) => promise()));
    results = [...results, ...result];
  }
  return results;
}

/** executes promises one at the time */
export async function sequentialPromiseAll<ReturnType>(
  promises: (() => Promise<ReturnType>)[]
): Promise<ReturnType[]> {
  let results: ReturnType[] = [];
  for (const promise of promises) {
    const result = await promise();
    results = [...results, result];
  }
  return results;
}
