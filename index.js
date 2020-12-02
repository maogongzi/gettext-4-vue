const fs = require("fs");
const Pofile = require('pofile');
const babelParser = require("@babel/parser");
const { default: babelTraverse } = require("@babel/traverse");
const compiler = require("vue-template-compiler");
const spaUtils = require("@vue/component-compiler-utils");

// TODO: support string combinations: "this is "+ "a field"

const spaContent = fs.readFileSync("./libs/components/FlowDialog.vue", "utf-8");

let parsedSpa = spaUtils.parse({
  source: spaContent,
  compiler,
  needMap: false
});

const helpersShortcutsMap = {
  gettext: "$_",
  pgettext: "$p_",
  ngettext: "$n_",
  npgettext: "$np_"
};

// all translation items
let translations = [];

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


function createPo(items) {
  const catalog = new Pofile();

  catalog.headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Transfer-Encoding': '8bit',
    'Generated-By': 'gettext-4-vue',
    'plural-forms': 'nplurals=2; plural=(n != 1);'
  };

  for (let item of items) {
    let entry = new Pofile.Item();

    if (item.callee === "gettext") {
      entry.msgstr = [];
      entry.msgid = item.args[0];
    } else if (item.callee === "ngettext") {
      entry.msgstr = ["", ""];
      entry.msgid = item.args[0];
      entry.msgid_plural = item.args[1];
    } else if (item.callee === "pgettext") {
      entry.msgstr = [];
      entry.msgctxt = item.args[0];
      entry.msgid = item.args[1];
    } else if (item.callee === "npgettext") {
      entry.msgstr = ["", ""];
      entry.msgctxt = item.args[0];
      entry.msgid = item.args[1];
      entry.msgid_plural = item.args[2];
    }

    // has filename references?
    entry.references = item.references;

    catalog.items.push(entry);
  }

  return catalog;
}


// find and register each translation entry
// TODO: warn possible invalid format
// quit if error occurred
function registerCallee(callee, args, references=[]) {
  if (callee === "gettext") {
    if (
      args.length < 1 ||
      typeof args[0] !== "string"
    ) {
      throw new Error(
        "gettext requires the first argument to be a string literal,\n" +
        "the rest, if present, will be counted as placeholder(%s) values\n" +
        `given: ${JSON.stringify(args)}`
      );
      process.exit(-1);
    }
  } else if  (callee === "pgettext") {
    if (
      args.length < 2 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string"
    ) {
      throw new Error(
        "pgettext requires the first two arguments to be string literals\n" +
        "the rest, if present, will be counted as placeholder(%1, %2, etc.) values\n" +
        `given: ${JSON.stringify(args)}`
      );
      process.exit(-1);
    }
  } else if  (callee === "ngettext") {
    if (
      args.length < 3 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string"
    ) {
      throw new Error(
        "ngettext requires the first two arguments to be string literals\n" +
        "the third to be anything that results in a number\n" +
        "the rest, if present, will be counted as placeholder(%1, %2, etc.) values\n" +
        `given: ${JSON.stringify(args)}`
      );
      process.exit(-1);
    }
  } else if  (callee === "npgettext") {
    if (
      args.length < 4 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string" ||
      typeof args[2] !== "string"
    ) {
      throw new Error(
        "npgettext requires the first three arguments to be string literals\n" +
        "the forth to be anything that results in a number\n" +
        "the rest, if present, will be counted as placeholder(%1, %2, etc.) values\n" +
        `given: ${JSON.stringify(args)}`
      );
      process.exit(-1);
    }
  }

  // remove duplicate entries(all signatures are the same including arguments)
  if (
    !translations.some((item) => {
      // basic check: msg and length of arguments are same.
      let flag = item.callee === callee &&
        item.args.length === args.length;

      // further check if every argument is the same
      if (flag === true) {
        for (let i = 0; i < args.length; i++) {
          if (item.args[i] !== args[i]) {
            flag = false;

            break;
          }
        }
      }

      return flag;
    })
  ) {
    translations.push({
      callee,
      args,
      references
    });
  }
}

// console.log(compiler.compile(parsedSpa.template.content))
// console.log(Object.keys(parsedSpa))
// console.log(Object.keys(parsedSpa.script))
// console.log(parsedSpa.script.type)

const tplFnTxt = compiler
  .compileToFunctions(parsedSpa.template.content)
  .render.toString();
const jsTxt = parsedSpa.script.content;

const tplFnAst = babelParser.parse(tplFnTxt);

// @param {String} srcType   "template|js", template indicates this
//  the walker will be applied on compiled vue SFC template function, in
//  which case we can't map the accurate line number of the translation
//  texts, but for "js", either it's the script part of the SFC, or an
//  individual module, we can obtain the exact matching line number
const walker = (path, srcType) => {
  if (
    path.node.type === "CallExpression"
  ) {
    // for cases: dialogTitle: this.$_() we should treat it as a
    // Member Expression with it's name wrapped up in `property` field
    let calleeName = path.node.callee.object
      ? path.node.callee.property.name
      : path.node.callee.name;

    if (Object.values(helpersShortcutsMap).includes(calleeName)) {
      // in js part this can be used
      // console.log(`${path.node.loc.start.line}:${path.node.loc.start.column}`);
      let args = path.node.arguments.map((arg) => getArgValue(arg));

      // TODO: should merge multiple same entries into one entry with
      // different references
      let references = srcType === "js"
        ? [`${path.node.loc.start.line}:${path.node.loc.start.column}`]
        : [];

      if (helpersShortcutsMap.gettext === calleeName) {
        registerCallee("gettext", args, references);
      } else if (helpersShortcutsMap.pgettext === calleeName) {
        registerCallee("pgettext", args, references);
      } else if (helpersShortcutsMap.ngettext === calleeName) {
        registerCallee("ngettext", args, references);
      } else if (helpersShortcutsMap.npgettext === calleeName) {
        registerCallee("npgettext", args, references);
      }
    }
  }
};

babelTraverse(tplFnAst, {
  enter(astPath) {
    walker(astPath, "template");
  }
});

const jsAst = babelParser.parse(jsTxt, {
  sourceType: "module"
});

fs.writeFileSync("./scp", JSON.stringify(jsAst));

babelTraverse(jsAst, {
  enter(astPath) {
    walker(astPath, "js");
  }
});

const individualScpTxt = fs.readFileSync("./libs/js/api-service.js", "utf-8");
const individualScpAst = babelParser.parse(individualScpTxt, {
  sourceType: "module"
});

babelTraverse(individualScpAst, {
  enter(astPath) {
    walker(astPath, "js");
  }
});


console.log(translations)
console.log(createPo(translations).toString())
console.log("done")