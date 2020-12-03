const Pofile = require('pofile');
const fs = require("fs");

// read file with utf-8 encoding
function read(filename) {
  return fs.readFileSync(filename, "utf-8");
}

function write(filename, content) {
  fs.writeFileSync(filename, content);
}

function createPot(items) {
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

module.exports = {
  read,
  write,
  createPot
};
