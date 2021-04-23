import { bulkProcess } from "../bulkProcessing";
import { defaultProcessRaceStateData } from "../types";
import { readManifestsFromFile } from "../util";

describe("process states from file", () => {
  const testManifestsFile = __dirname + "/../__mockData__/test-manifests.json";
  const manifests = readManifestsFromFile(testManifestsFile);
  it("should run", () => {
    // console.log("Test is running");
  });
});

describe("process single state messages", () => {
  const testManifestsFile = __dirname + "/../__mockData__/test-manifests.json";
  const manifests = readManifestsFromFile(testManifestsFile);
  const baseData = { ...defaultProcessRaceStateData };
  const emptyData = { cars: [], pits: [], messages: [], session: [] };
  it("should handle empty json", () => {
    expect(bulkProcess(baseData, manifests, [])).toMatchObject(defaultProcessRaceStateData);
  });

  it("should process carInfo with driver change", () => {
    const data = [
      {
        ...emptyData,
        session: [10, 3600, 10, "GREEN"],
        cars: [
          ["RUN", "1", "D1", "T1", "", "1", "1", "1", "0", "0", "0", "0"],
          ["RUN", "2", "D2", "T2", "", "2", "2", "1", "0", "0", "0", "0"],
        ],
      },
      {
        ...emptyData,
        session: [20, 3600, 10, "GREEN"],
        cars: [
          ["RUN", "1", "D1b", "T1", "", "1", "1", "1", "0", "0", "0", "0"],
          ["RUN", "2", "D2", "T2", "", "2", "2", "1", "0", "0", "0", "0"],
        ],
      },
    ];
    const result = bulkProcess(baseData, manifests, data);

    expect(result).toMatchObject({
      raceOrder: ["1", "2"],
      carInfo: [
        {
          carNum: "1",
          carClass: "",
          name: "T1",
          current: { driverName: "D1b", seatTime: [{ enterCarTime: 20, leaveCarTime: 20 }] },
          drivers: [
            {
              driverName: "D1",
              seatTime: [{ enterCarTime: 10, leaveCarTime: 10 }],
            },
            { driverName: "D1b", seatTime: expect.any(Object) },
          ],
        },
        {
          carNum: "2",
          carClass: "",
          name: "T2",
          current: { driverName: "D2", seatTime: [{ enterCarTime: 10, leaveCarTime: 20 }] },
          drivers: [
            {
              driverName: "D2",
              seatTime: [{ enterCarTime: 10, leaveCarTime: 20 }],
            },
          ],
        },
      ],
    });
  });
});
