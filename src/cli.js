const fs=require('fs')
const arg = require('arg');
const utils = require('./utils');
// const extractor

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

module.exports.cli = async function(args) {
  let options = parseArgumentsIntoOptions(args);

  if (options.patterns.length === 0) {
    throw new Error("Please specify at least one glob pattern, either vue SPA or js module");
  }

  let fileList = await utils.retriveFiles(options.patterns);

  console.log(fileList);
}
