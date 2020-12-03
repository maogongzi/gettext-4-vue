const fs=require('fs')
const path=require('path')
const arg = require('arg');
const utils = require('./utils');
const extractor = require('./extractor');
const io = require('./io');

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

  fileList.forEach((file) => {
    if (path.extname(file) === ".vue") {
      let res = extractor.extractComponent(file);

      if (res.length > 0) {
        console.log(file)
        console.log(res)
      }
    } else if (path.extname(file) === ".js") {
      extractor.extractJsModule(file);
    }
  })
}
