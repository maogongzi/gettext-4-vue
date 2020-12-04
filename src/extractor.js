const babelParser = require("@babel/parser");
const babelTraverse = require("@babel/traverse").default;
const vueTemplateCompiler = require("vue-template-compiler");
const vueComponentCompilerUtils = require("@vue/component-compiler-utils");
const utils = require("./utils");
const io = require("./io");

/**
 * Returns a raw string from some JSX attributes or call
 * expression arguments.
 * @see https://github.com/laget-se/react-gettext-parser/blob/master/src/
 *  node-helpers.js
 */
function getArgValue(argNode) {
  let retrived = null;

  if (argNode.type === 'BinaryExpression') {
    if (argNode.operator === '+') {
      const left = getArgValue(argNode.left)
      const right = getArgValue(argNode.right)

      if (left && right) {
        // "Julius " + "Caesar" => "Julius Caesar"
        retrived = left + right;
      }
    }
  } else if (argNode.type === 'StringLiteral') {
    retrived = argNode.value;
  }

  return retrived;
}

// find and register each translation entry
// TODO: warn possible invalid format
// quit if error occurred
function verifyEntry(call, args, { filename, line="?", column="?" }) {
  let error = null;

  if (call === "gettext") {
    if (
      args.length < 1 ||
      typeof args[0] !== "string"
    ) {
      error = "gettext requires the first argument to be a string literal," +
        "the rest, if present, will be counted as placeholder(%s) values\n" +
        `Given: ${JSON.stringify(args)}\n` +
        `Problematic file: ${filename}\n` +
        `Line number(template block will be blank): ${line},${column}`;
    }
  } else if  (call === "pgettext") {
    if (
      args.length < 2 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string"
    ) {
      error = "pgettext requires the first two arguments to be string" +
        " literals, the rest, if present, will be counted as" +
        " placeholder(%1, %2, etc.) values\n" +
        `Given: ${JSON.stringify(args)}\n` +
        `Problematic file: ${filename}\n` +
        `Line number(template block will be blank): ${line},${column}`;
    }
  } else if  (call === "ngettext") {
    if (
      args.length < 3 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string"
    ) {
      error = "ngettext requires the first two arguments to be" +
        " string literals, the third to be anything that results in a" +
        " number, the rest, if present, will be counted as" +
        "placeholder(%1, %2, etc.) values\n" +
        `Given: ${JSON.stringify(args)}\n` +
        `Problematic file: ${filename}\n` +
        `Line number(template block will be blank): ${line},${column}`;
    }
  } else if  (call === "npgettext") {
    if (
      args.length < 4 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string" ||
      typeof args[2] !== "string"
    ) {
      error = "npgettext requires the first three arguments to be" +
        " string literals, the forth to be anything that results in a" +
        " number, the rest, if present, will be counted as" +
        " placeholder(%1, %2, etc.) values\n" +
        `Given: ${JSON.stringify(args)}\n` +
        `Problematic file: ${filename}\n` +
        `LineNo(in <template> block will be blank): ${line},${column}`;
    }
  }

  if (error) {
    throw new Error(error);
  }

  return true;
}

// @param {String} srcType   "template|js", template indicates this
//  the walker will be applied on compiled vue SFC template function, in
//  which case we can't map the accurate line number of the translation
//  texts, but for "js", either it's the script part of the SFC, or an
//  individual module, we can obtain the exact matching line number
function astWalker(astPath, cb) {
  // only extract function calls
  if (astPath.node.type === "CallExpression") {
    // for cases: dialogTitle: this.$_() we should treat it as a
    // Member Expression with it's name wrapped up in `property` field
    let calleeName = astPath.node.callee.object
      ? astPath.node.callee.property.name
      : astPath.node.callee.name;

    if (utils.GETTEXT_CALL_SHORTCUTS.includes(calleeName)) {
      let call = utils.GETTEXT_CALL_MAP_REVERSED[calleeName];
      // in js part this can be used
      let args = astPath.node.arguments.map((arg) => getArgValue(arg));

      cb(call, args, astPath.node.loc.start);
    }
  }
};

// extract translations from a vue SFC or a js module(es5)
function extractComponent(filename) {
  const fileCont = io.read(filename);
  const parsedSpa = vueComponentCompilerUtils.parse({
    source: fileCont,
    compiler: vueTemplateCompiler,
    needMap: false
  });

  // cache for all translations of this component
  let translations = [];

  // only process when there is <template> block, in case some components
  // use render function instead of template.
  if (parsedSpa.template) {
    const renderFnTxt = vueTemplateCompiler
      .compileToFunctions(parsedSpa.template.content)
      .render
      .toString();
    const renderFnAst = babelParser.parse(renderFnTxt);

    babelTraverse(renderFnAst, {
      enter(astPath) {
        astWalker(astPath, (call, args) => {
          // for <template> block, line number and column is pointless since
          // the transformmed render function is not percisely mapped to
          // the template
          if (verifyEntry(call, args, { filename })) {
            translations.push({
              call,
              args,
              // for template block, we can't map to the exact line number
              reference: filename
            });
          }
        });
      }
    });
  }

  // only process when there is <script> block, in case some components
  // don't have this block
  if (parsedSpa.script) {
    const scriptTxt = parsedSpa.script.content;
    const scriptAst = babelParser.parse(scriptTxt, {
      // script block inside components use es2015 syntax
      sourceType: "module"
    });

    babelTraverse(scriptAst, {
      enter(astPath) {
        astWalker(astPath, (call, args, { line, column }) => {
          if (verifyEntry(call, args, { filename, line, column })) {
            translations.push({
              call,
              args,
              reference: `${filename}:${line},${column}`
            });
          }
        });
      }
    });
  }

  return translations;
}

// parse a normal js module(should be in es6 format)
function extractJsModule(filename) {
  const fileCont = io.read(filename);

  const scriptAst = babelParser.parse(fileCont, {
    // script block inside components use es2015 syntax
    sourceType: "module"
  });

  // cache for all translations of this js module
  let translations = [];

  babelTraverse(scriptAst, {
    enter(astPath) {
      astWalker(astPath, (call, args, { line, column }) => {
        if (verifyEntry(call, args, { filename, line, column })) {
          translations.push({
            call,
            args,
            reference: `${filename}:${line},${column}`
          });
        }
      });
    }
  });

  return translations;
}

module.exports = {
  extractComponent,
  extractJsModule
};
