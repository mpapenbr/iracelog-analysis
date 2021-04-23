import { createManifests, readManifestsFromFile } from "../util";

describe("compose manifests", () => {
  const miniManifestArray = __dirname + "/../__mockData__/mini-manifests-array.json";
  const miniManifestSingle = __dirname + "/../__mockData__/mini-manifests-single.json";

  const reference = {
    car: [{ type: "string", name: "a" }],
    session: [{ type: "string", name: "b" }],
    pit: [{ type: "string", name: "c" }],
    message: [{ type: "string", name: "d" }],
  };

  test("create from short ", () => {
    expect(createManifests({ car: ["a"], session: ["b"], pit: ["c"], message: ["d"] })).toEqual(reference);
  });

  test("read from file (array)", () => {
    expect(readManifestsFromFile(miniManifestArray)).toEqual(reference);
  });
  test("read from file (single)", () => {
    expect(readManifestsFromFile(miniManifestSingle)).toEqual(reference);
  });
});
