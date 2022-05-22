import { readManifestsFromFile } from "../../backend";
import { bulkProcess } from "../bulkProcessing";

/**
 * This module verifies the correct handling of cars.last formats (number vs [number,string])
 *
 */
describe("handling cars.last with number and [number,string]", () => {
  const testManifestsFile = __dirname + "/../__mockData__/test-manifests.json";
  const manifests = readManifestsFromFile(testManifestsFile);
  const emptyData = { type: 1, timestamp: 1, payload: { cars: [], pits: [], messages: [], session: [] } };
  const emptyPayload = { cars: [], pits: [], messages: [], session: [] };

  it("should handle number", () => {
    // note: the important part is session[0] (=sessionTime)
    const data = [
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [10, 3600, 10, "GREEN"],
          // "state", "carNum", "userName", "teamName", "carClass", "pos", "pic", "lap", "lc", "gap", "last", "best"
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 2, 1, 0, 10, 0],
            ["RUN", "2", "D2", "T2", "", 2, 2, 2, 1, 0, 11, 0],
          ],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [11, 3600, 10, "GREEN"],
          // "state", "carNum", "userName", "teamName", "carClass", "pos", "pic", "lap", "lc", "gap", "last", "best"
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 3, 2, 0, [9, "ob"], 0],
            ["RUN", "2", "D2", "T2", "", 2, 2, 3, 2, 10, [10.5, "pb"], 0],
          ],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [15, 3600, 10, "GREEN"],
          // "state", "carNum", "userName", "teamName", "carClass", "pos", "pic", "lap", "lc", "gap", "last", "best"
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 4, 3, 0, 11, 0],
            ["RUN", "2", "D2", "T2", "", 2, 2, 4, 3, 10, [8, "ob"], 0],
          ],
        },
      },
    ];

    const expectResult = {
      carLaps: [
        {
          carNum: "1",
          laps: [
            { lapNo: 1, lapTime: 10 },
            { lapNo: 2, lapTime: 9 },
            { lapNo: 3, lapTime: 11 },
          ],
        },
        {
          carNum: "2",
          laps: [
            { lapNo: 1, lapTime: 11 },
            { lapNo: 2, lapTime: 10.5 },
            { lapNo: 3, lapTime: 8 },
          ],
        },
      ],
    };
    const result = bulkProcess(manifests, data);
    // console.log(JSON.stringify(result, null, 2));
    expect(result).toMatchObject(expectResult);
  });
});
