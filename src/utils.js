const glob = require("glob");

module.exports.retriveFiles = async (patterns) => {
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
