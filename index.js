const fs = require("fs");
const Pofile = require('pofile');
const babelParser = require("@babel/parser");
const { default: babelTraverse } = require("@babel/traverse");
const compiler = require("vue-template-compiler");
const spaUtils = require("@vue/component-compiler-utils");

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


function createPo(items) {
  const catalog = new Pofile();

  catalog.headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Transfer-Encoding': '8bit',
    'Generated-By': 'gettext-4-vue',
    'Project-Id-Version': '',
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

    catalog.items.push(entry);
  }

  return catalog;
}


// find and register each translation entry
// TODO: warn possible invalid format
// quit if error occurred
function registerCallee(callee, args) {
  if (callee === "gettext") {
    if (
      args.length !== 1 ||
      typeof args[0] !== "string"
    ) {
      throw new Error(
        "gettext requires 1 single string argument\n" +
        `given: ${JSON.stringify(args)}`
      );
      process.exit(-1);
    }
  } else if  (callee === "pgettext") {
    if (
      args.length !== 2 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string"
    ) {
      throw new Error(
        "pgettext requires 2 string arguments\n" +
        `given: ${JSON.stringify(args)}`
      );
      process.exit(-1);
    }
  } else if  (callee === "ngettext") {
    if (
      args.length !== 3 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string"
    ) {
      throw new Error(
        "ngettext requires 3 arguments, the first two should be string\n" +
        `given: ${JSON.stringify(args)}`
      );
      process.exit(-1);
    }
  } else if  (callee === "npgettext") {
    if (
      args.length !== 4 ||
      typeof args[0] !== "string" ||
      typeof args[1] !== "string" ||
      typeof args[2] !== "string"
    ) {
      throw new Error(
        "npgettext requires 4 arguments, the first three should be string\n" +
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
      args
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

const walker = (path) => {
  if (
    path.node.type === "CallExpression"
  ) {
    // for cases: dialogTitle: this.$_() we should treat it as a
    // Member Expression with it's name wrapped up in `property` field
    // TODO: support string combinations: "this is "+ "a field"
    let calleeName = path.node.callee.name || path.node.callee.property.name;

    if (Object.values(helpersShortcutsMap).includes(calleeName)) {
      // in js part this can be used
      // console.log(`${path.node.loc.start.line}:${path.node.loc.start.column}`);
      let args = path.node.arguments.map((arg) => {
        return arg.value;
      });

      if (helpersShortcutsMap.gettext === calleeName) {
        registerCallee("gettext", args);
      } else if (helpersShortcutsMap.pgettext === calleeName) {
        registerCallee("pgettext", args);
      } else if (helpersShortcutsMap.ngettext === calleeName) {
        registerCallee("ngettext", args);
      } else if (helpersShortcutsMap.npgettext === calleeName) {
        registerCallee("npgettext", args);
      }
    }
  }
};

// babelTraverse(tplFnAst, {
//   enter: walker
// });

const jsAst = babelParser.parse(jsTxt, {
  sourceType: "module"
});

fs.writeFileSync("./scp", JSON.stringify(jsAst));

babelTraverse(jsAst, {
  enter: walker
});

const individualScpTxt = fs.readFileSync("./libs/js/api-service.js", "utf-8");
const individualScpAst = babelParser.parse(individualScpTxt, {
  sourceType: "module"
});

// babelTraverse(individualScpAst, {
//   enter: walker
// });


console.log(translations)
console.log(createPo(translations).toString())
console.log("done")