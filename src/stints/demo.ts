import { readManifestsFromFile } from "./util";

const manifests = readManifestsFromFile(__dirname + "/manifest-neo.json");
console.log(manifests);
