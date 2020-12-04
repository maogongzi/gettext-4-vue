const babelRegister = require("@babel/register");
const babelCfg = require("./config");
const entryScript = process.env.BABEL_ENTRY_SCRIPT;

// 添加 es6 hooks
babelRegister(babelCfg);

// 分析并用调用 babel 编译指定 entry 脚本，如果指定了的话
entryScript && require(entryScript);
