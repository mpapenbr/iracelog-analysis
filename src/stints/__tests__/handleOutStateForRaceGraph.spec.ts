import { readManifestsFromFile } from "../../backend";
import { bulkProcess } from "../bulkProcessing";
import { CarComputeState } from "../types";

/**
 * This module checks if the cars in state CarComputeState.OUT are removed from raceGraph
 *
 */
describe("handling OUT state", () => {
  const testManifestsFile = __dirname + "/../__mockData__/test-manifests.json";
  const manifests = readManifestsFromFile(testManifestsFile);
  const emptyData = { type: 1, timestamp: 1, payload: { cars: [], pits: [], messages: [], session: [] } };
  const emptyPayload = { cars: [], pits: [], messages: [], session: [] };

  it("should mark the car as out-of-race on init RUN state", () => {
    // note: the important part is session[0] (=sessionTime)
    const data = [
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [10, 3600, 10, "GREEN"],
          // "state", "carNum", "userName", "teamName", "carClass", "pos", "pic", "lap", "lc", "gap", "last", "best"
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 2, 1, 0, 0, 0],
            ["RUN", "2", "D2", "T2", "", 2, 2, 2, 1, 0, 0, 0],
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
            ["RUN", "1", "D1", "T1", "", 1, 1, 2, 1, 0, 0, 0],
            ["RUN", "2", "D2", "T2", "", 2, 2, 2, 1, 10, 0, 0],
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
            ["RUN", "1", "D1", "T1", "", 1, 1, 3, 2, 0, 0, 0],
            ["RUN", "2", "D2", "T2", "", 2, 2, 3, 2, 10, 0, 0],
          ],
        },
      },

      // trigger OUT for D2
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [20, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 3, 2, 0, 0, 0],
            ["OUT", "2", "D2", "T2", "", 2, 2, 3, 2, 10, 0, 0],
          ],
        },
      },
      // D2 will now get into ComputeCarState.OUT
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [90, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 3, 2, 0, 0, 0],
            ["OUT", "2", "D2", "T2", "", 2, 2, 3, 2, 10, 0, 0],
          ],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [100, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 4, 3, 0, 0, 0],
            ["OUT", "2", "D2", "T2", "", 2, 2, 2, 1, 10, 0, 0],
          ],
        },
      },
    ];

    const expectResult = {
      carComputeState: [
        { carNum: "1", outEncountered: 0, state: CarComputeState.RUN },
        { carNum: "2", outEncountered: 20, state: CarComputeState.OUT },
      ],
      raceOrder: ["1", "2"],
      raceGraph: [
        {
          carClass: "overall",
          lapNo: 1,
          gaps: [
            { lapNo: 1, carNum: "1", pos: 1, pic: 1, gap: 0 },
            { lapNo: 1, carNum: "2", pos: 2, pic: 2, gap: 10 },
          ],
        },
        {
          carClass: "overall",
          lapNo: 2,
          gaps: [{ lapNo: 2, carNum: "1", pos: 1, pic: 1, gap: 0 }],
        },
        {
          carClass: "overall",
          lapNo: 3,
          gaps: [{ lapNo: 3, carNum: "1", pos: 1, pic: 1, gap: 0 }],
        },
      ],
    };
    const result = bulkProcess(manifests, data);
    // console.log(JSON.stringify(result, null, 2));
    expect(result).toMatchObject(expectResult);
  });
});
