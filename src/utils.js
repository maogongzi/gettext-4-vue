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

// create pot file
function createPot(gettextCalls) {
  const catalog = new Pofile();

  catalog.headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Transfer-Encoding': '8bit',
    'Generated-By': 'gettext-4-vue'
  };

  // should merge duplicated entries
  for (let item of gettextCalls) {
    if (item.call === "gettext") {
      // try to find an entry with identical msg id, if there is one we
      // will stop creating new entry, instead simply add references to
      // the existing entry
      let existingEntry = catalog.items.find((x) => {
        // only those messages sharing the same message id but don't have
        // a context can be counted as the same message
        return x.msgid === item.args[0] && !x.msgctxt;
      });

      // found an existing entry with the same msg id
      if (existingEntry) {
        // only append reference if it doesn't exist in the reference list
        // of the existing entry
        if (!existingEntry.references.includes(item.reference)) {
          existingEntry.references.push(item.reference);
        }
      } else {
        // else: create a new entry
        let entry = new Pofile.Item();

        entry.msgid = item.args[0];
        entry.msgstr = [];
        // has filename references?(by default we'll have at least
        // one reference pointing to the filename, this occurs in vue
        // components since we can't obtain the exact line number of the
        // transformed render function of the template block because
        // the AST provided by Vue doesn't expose line numbers)
        entry.references = [item.reference];

        catalog.items.push(entry);
      }
    } else if (item.call === "ngettext") {
      let existingEntry = catalog.items.find((x) => {
        // only those messages sharing the same message id but don't have
        // a context can be counted as the same message
        return x.msgid === item.args[0] && !x.msgctxt;
      });

      if (existingEntry) {
        // only append reference if it doesn't exist in the reference list
        // of the existing entry
        if (!existingEntry.references.includes(item.reference)) {
          existingEntry.references.push(item.reference);
        }
      } else {
        // else: create a new entry
        let entry = new Pofile.Item();

        entry.msgid = item.args[0];
        entry.msgid_plural = item.args[1];
        entry.msgstr = ["", ""];
        entry.references = [item.reference];

        catalog.items.push(entry);
      }
    } else if (item.call === "pgettext") {
      let existingEntry = catalog.items.find((x) => {
        // only those messages sharing the same message id and context
        // can be counted as the same message
        return x.msgid === item.args[1] && x.msgctxt === item.args[0];
      });

      if (existingEntry) {
        // only append reference if it doesn't exist in the reference list
        // of the existing entry
        if (!existingEntry.references.includes(item.reference)) {
          existingEntry.references.push(item.reference);
        }
      } else {
        // else: create a new entry
        let entry = new Pofile.Item();

        entry.msgid = item.args[1];
        entry.msgstr = [];
        entry.msgctxt = item.args[0];
        entry.references = [item.reference];

        catalog.items.push(entry);
      }
    } else if (item.call === "npgettext") {
      let existingEntry = catalog.items.find((x) => {
        // only those messages sharing the same message id and context
        // can be counted as the same message
        return x.msgid === item.args[1] && x.msgctxt === item.args[0];
      });

      if (existingEntry) {
        // only append reference if it doesn't exist in the reference list
        // of the existing entry
        if (!existingEntry.references.includes(item.reference)) {
          existingEntry.references.push(item.reference);
        }
      } else {
        // else: create a new entry
        let entry = new Pofile.Item();

        entry.msgid = item.args[1];
        entry.msgid_plural = item.args[2];
        entry.msgstr = ["", ""];
        entry.msgctxt = item.args[0];
        entry.references = [item.reference];

        catalog.items.push(entry);
      }
    }
  }

  return catalog;
}

module.exports = {
  GETTEXT_CALL_MAP,
  GETTEXT_CALL_NAMES,
  GETTEXT_CALL_SHORTCUTS,
  GETTEXT_CALL_MAP_REVERSED,
  retriveFiles,
  createPot
};
