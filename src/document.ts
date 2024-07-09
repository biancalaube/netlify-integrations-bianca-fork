import { NetlifyIntegration } from "@netlify/sdk";
import { JSONPath } from "jsonpath-plus";

export class Document {
  //Return indexing data from a page's JSON-formatted AST for search purposes
  tree: any;
  robots: any;
  keywords: any;
  description: any;
  paragraphs: any;
  code: any;
  title: any;
  headings: any;
  slug: any;
  preview: any;
  facets: any;
  noIndex: any;
  reasons: any;

  constructor(doc: any) {
    this.tree = doc;
    // this.tree.ast = JSON.stringify(this.tree.ast);
    console.log("called doc");
    //find metadata
    [this.robots, this.keywords, this.description] = this.findMetadata();
    //find paragraphs
    this.paragraphs = this.findParagraphs();
    //find code
    this.code = this.findCode();

    //find title, headings
    //find slug
    //find preview
    //find facets
  }

  findMetadata() {
    console.log("Finding metadata");
    let robots: Boolean = true; //can be set in the rst if the page is supposed to be crawled
    let keywords: string[] | null = null; //keywords is an optional list of strings
    let description: string | null = null; //this can be optional??

    let results = JSONPath({
      path: "$..children[?(@.name=='meta')]..options",
      json: this.tree,
    });
    // console.log("\n\r metadata results:", results);
    if (results.length) {
      if (results.length > 1)
        console.log(
          "length of results is greater than one, it's: " + results.length
        );
      const val = results[0];
      //check if robots, set to false if no robots
      if ("robots" in val && (val.robots == "None" || val.robots == "noindex"))
        robots = false;

      keywords = val.keywords ?? null;
      description = val.description ?? null;
      console.log(
        `robots: ${robots}, keywords: ${keywords}, description: ${description}`
      );
      return [robots, keywords, description];
    }

    return [];
  }

  findParagraphs() {
    console.log("Finding paragraphs");
    let paragraphs = "";

    let results = JSONPath({
      path: "$..children[?(@.type=='paragraph')]..value",
      json: this.tree,
    });

    console.log("\n\r paragraph results:", results);
    for (let r of results) {
      paragraphs += r;
    }
    return paragraphs;
  }

  findCode() {
    console.log("finding code");

    let results = JSONPath({
      path: "$..children[?(@.type=='code')]",
      json: this.tree,
    });

    console.log("\n\r code results:", results);

    let codeContents = [];
    for (let r of results) {
      const lang = r.lang ?? null;
      codeContents.push({ lang: lang, value: r.value });
    }
    console.log(`codeContents: ${codeContents}`);
    return codeContents;
  }
}
