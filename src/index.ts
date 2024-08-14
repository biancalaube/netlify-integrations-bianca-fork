// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { Manifest } from "./generateManifest/manifest";
import { promisify } from "util";
import { BSON } from "bson";
import { Document } from "./generateManifest/document";
import { uploadManifest } from "./uploadToAtlas/uploadManifest";

import { readdir, readFileSync } from "fs";

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();
const ZIP_PATH = ``;

export const generateManifest = async () => {
  // create Manifest object
  const manifest = new Manifest(true);
  console.log("=========== generating manifests ================");
  //go into documents directory and get list of file entries

  const entries = await readdirAsync("documents", { recursive: true });

  const mappedEntries = entries.filter((fileName) => {
    return (
      fileName.includes(".bson") &&
      !fileName.includes("images") &&
      !fileName.includes("includes") &&
      !fileName.includes("sharedinclude")
    );
  });

  //need a check here?
  process.chdir("documents");
  for (const entry of mappedEntries) {
    //each file is read and decoded
    const decoded = BSON.deserialize(readFileSync(`${entry}`));
    //put file into Document object
    //export Document object
    const processedDoc = new Document(decoded).exportAsManifestDocument();
    //add document to manifest object
    manifest.addDocument(processedDoc);
  }
  return manifest;
};

//Return indexing data from a page's AST for search purposes.
integration.addBuildEventHandler(
  "onSuccess",
  async ({ utils: { run }, netlifyConfig }) => {
    // Get content repo zipfile in AST representation.

    await run.command("unzip -o bundle.zip");
    const branch = netlifyConfig.build?.environment["BRANCH"];

    //use export function for uploading to S3
    const manifest = await generateManifest();

    console.log("=========== finished generating manifests ================");
    console.log("=========== Uploading Manifests to Atlas =================");
    try {
      await uploadManifest(manifest, branch);
    } catch (e) {
      console.log("Manifest could not be uploaded", e);
    }
  }
);

export { integration };
