import _ from "lodash";

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
