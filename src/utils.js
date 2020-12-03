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

module.exports = {
  retriveFiles,
  GETTEXT_CALL_MAP,
  GETTEXT_CALL_NAMES,
  GETTEXT_CALL_SHORTCUTS
};
