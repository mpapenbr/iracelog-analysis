import { readManifestsFromFile } from "../../backend";
import { bulkProcess } from "../bulkProcessing";
import { CarComputeState } from "../types";

/**
 * This module checks if the carInfo (seatTime) is processed correct
 *
 */
describe("handling OUT state (seat time)", () => {
  const testManifestsFile = __dirname + "/../__mockData__/test-manifests.json";
  const manifests = readManifestsFromFile(testManifestsFile);
  const emptyData = { type: 1, timestamp: 1, payload: { cars: [], pits: [], messages: [], session: [] } };
  const emptyPayload = { cars: [], pits: [], messages: [], session: [] };

  it("should handle rejoin with seat time", () => {
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
            ["RUN", "2", "D2a", "T2", "", 2, 2, 2, 1, 0, 0, 0],
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
            ["RUN", "2", "D2a", "T2", "", 2, 2, 2, 1, 10, 0, 0],
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
            ["RUN", "2", "D2a", "T2", "", 2, 2, 3, 2, 10, 0, 0],
          ],
        },
      },

      // trigger OUT for #2 (simulate a disconnect)
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [20, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 3, 2, 0, 0, 0],
            ["OUT", "2", "D2a", "T2", "", 2, 2, 3, 2, 10, 0, 0],
          ],
        },
      },
      // car #2 will now get into ComputeCarState.OUT
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [90, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 3, 2, 0, 0, 0],
            ["OUT", "2", "D2a", "T2", "", 2, 2, 3, 2, 10, 0, 0],
          ],
        },
      },

      // another team driver (D2b) enters the car
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [100, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 4, 3, 0, 0, 0],
            ["PIT", "2", "D2b", "T2", "", 2, 2, 2, 1, 10, 0, 0],
          ],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [101, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 4, 3, 0, 0, 0],
            ["PIT", "2", "D2b", "T2", "", 2, 2, 2, 1, 10, 0, 0],
          ],
        },
      },

      // car #2 leaves PIT again
      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [110, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 4, 3, 0, 0, 0],
            ["RUN", "2", "D2b", "T2", "", 2, 2, 2, 1, 10, 0, 0],
          ],
        },
      },

      {
        ...emptyData,
        payload: {
          ...emptyPayload,
          session: [111, 3600, 10, "GREEN"],
          cars: [
            ["RUN", "1", "D1", "T1", "", 1, 1, 4, 3, 0, 0, 0],
            ["RUN", "2", "D2b", "T2", "", 2, 2, 2, 1, 10, 0, 0],
          ],
        },
      },
    ];

    const expectResult = {
      carComputeState: [
        { carNum: "1", outEncountered: 0, state: CarComputeState.RUN },
        { carNum: "2", outEncountered: 0, state: CarComputeState.RUN },
      ],
      raceOrder: ["1", "2"],
      carInfo: [
        {
          carNum: "1",
          current: { driverName: "D1", seatTime: [{ enterCarTime: 10, leaveCarTime: 111 }] },
        },
        {
          carNum: "2",
          current: { driverName: "D2b", seatTime: [{ enterCarTime: 100, leaveCarTime: 111 }] },
          drivers: [
            { driverName: "D2a", seatTime: [{ enterCarTime: 10, leaveCarTime: 20 }] },
            { driverName: "D2b", seatTime: [{ enterCarTime: 100, leaveCarTime: 111 }] },
          ],
        },
      ],
    };
    const result = bulkProcess(manifests, data);
    // console.log(JSON.stringify(result.carInfo, null, 2));
    expect(result).toMatchObject(expectResult);
  });
});
