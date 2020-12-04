import fs from "fs";
import path from 'path';
import arg from 'arg';
import utils from './utils';
import extractor from './extractor';
import io from './io';

function parseArgumentsIntoOptions(rawArgs) {
 const args = arg(
   {
     '--patterns': [String],
     '--output': String,
     '-p': '--patterns',
     '-o': '--output',
   },
   {
     argv: rawArgs.slice(2),
   }
 );

 return {
   patterns: args['--patterns'] || [],
   output: args['--output'] || "./output.pot"
 };
}

async function cli(args) {
  let options = parseArgumentsIntoOptions(args);

  if (options.patterns.length === 0) {
    throw new Error("Please specify at least one glob pattern, " + "either vue SPA or js module");
  }

  let fileList = await utils.retriveFiles(options.patterns);
  let allTranslations = [];

  // iterate through each file, both vue components and js modules(in es2015
  // format) and extract and merge translations into the center catlog.
  fileList.forEach((file) => {
    if (path.extname(file) === ".vue") {
      allTranslations.push.apply(
        allTranslations,
        extractor.extractComponent(file)
      );
    } else if (path.extname(file) === ".js") {
      allTranslations.push.apply(
        allTranslations,
        extractor.extractJsModule(file)
      );
    }
  });

  // save pot file
  io.write(options.output, utils.createPot(allTranslations));
  console.log(`All ${allTranslations.length} translations have been` +
    `extracted and saved to ${options.output}`);
}

export default cli;
