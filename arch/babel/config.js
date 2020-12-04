const path = require("path");

module.exports = {
  // do not compile modules from node modules
  ignore: [
    /node_modules/
  ],

  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          // 仅针对当前运行时 node 版本 转码，已实现的feature不做转换（
          // 如 let，const 等）
          node: "current"
        },

        // only load the subset of functionalities that have been used across
        // the APP
        useBuiltIns: "usage",

        // @babel/polyfill has been deprecated in favor of new method to
        // integrate core-js into the project, also we need to specify a
        // version for core js to make it possible for Babel to tackle and
        // optimize translated code based on it's version.
        corejs: "3.4"
      }
    ]
  ],

  plugins: [
    // babel alias，用于缩减引用路径，例如：
    // 注意，和webpack alias 不是一个概念，例如 __imgs
    // @@utils: path/to/utils
    // const MyUtilFn = require('../../../../utils/MyUtilFn');
    // ->
    // const MyUtilFn = require('@@utils/MyUtilFn');
    [
      "module-resolver",
      {
        root: [process.cwd()],
        alias: { "@@arch": path.resolve(process.cwd(), "arch") }
      }
    ]
  ]
};