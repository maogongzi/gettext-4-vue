const fs = require("fs");
const path = require("path");

// read file with utf-8 encoding
function read(filename) {
  return fs.readFileSync(filename, "utf-8");
}

function write(filename, content) {
  // create the folder if it doesn't exist
  fs.mkdirSync(filename.split(path.basename(filename))[0], {
    recursive: true
  });

  fs.writeFileSync(filename, content);
}

module.exports = {
  read,
  write
};
