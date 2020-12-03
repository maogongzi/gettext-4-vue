const Pofile = require('pofile');
const glob = require("glob");

// supported gettext calls
const GETTEXT_CALL_MAP = {
  gettext: "$_",
  pgettext: "$p_",
  ngettext: "$n_",
  npgettext: "$np_"
};

const GETTEXT_CALL_NAMES = Object.keys(GETTEXT_CALL_MAP);
const GETTEXT_CALL_SHORTCUTS = Object.values(GETTEXT_CALL_MAP);
// {$_: gettext}
const GETTEXT_CALL_MAP_REVERSED = GETTEXT_CALL_NAMES.reduce((acc, cur, idx) => {
  acc[GETTEXT_CALL_SHORTCUTS[idx]] = cur;

  return acc;
}, {});


// convert glob patterns into a flat file list
async function retriveFiles(patterns) {
  // glob matching is performed asynchronously, so we need to wrap it up into
  // a promise
  let tasks = patterns.map((pattern) => {
    return new Promise((res2, rej2) => {
      glob(pattern, function(err, files) {
        if (err) {
          rej2(err);
        }

        res2(files);
      });
    });
  });

  return await Promise.all(tasks)
    .then((res) => {
      return res.flat();
    });
};

// check whether there is a duplicated message id, if so, only mutate
// the references of the existing one, do not add new entries.
function findEntry(translations, entry) {
  return translations.findIndex((item) => {
    // basic check: msg and length of arguments are same.
    let flag = item.call === entry.call &&
      item.args.length === entry.args.length;

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
  });
}

function createPot(gettextCalls) {
  const catalog = new Pofile();

  catalog.headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Transfer-Encoding': '8bit',
    'Generated-By': 'gettext-4-vue',
    'plural-forms': 'nplurals=2; plural=(n != 1);'
  };

  for (let item of gettextCalls) {
    let entry = new Pofile.Item();

    if (item.call === "gettext") {
      entry.msgstr = [];
      entry.msgid = item.args[0];
    } else if (item.call === "ngettext") {
      entry.msgstr = ["", ""];
      entry.msgid = item.args[0];
      entry.msgid_plural = item.args[1];
    } else if (item.call === "pgettext") {
      entry.msgstr = [];
      entry.msgctxt = item.args[0];
      entry.msgid = item.args[1];
    } else if (item.call === "npgettext") {
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

module.exports = {
  GETTEXT_CALL_MAP,
  GETTEXT_CALL_NAMES,
  GETTEXT_CALL_SHORTCUTS,
  retriveFiles,
  createPot
};
