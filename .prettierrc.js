// 优先使用本全局唯一的 prettier 配置文件
// 配置可参考 https://prettier.io/en/configuration.html、https://www.cnblogs.com/oneweek/p/11236515.html
module.exports = {
  // 使用较大的打印宽度，因为 Prettier 的换行设置似乎是针对没有注释的 JavaScript.
  printWidth: 120,

  // 使用 .gitattributes 来管理换行，尾空行
  endOfLine: 'lf',

  // 单引号代替双引号
  singleQuote: true,

  // 句尾添加分号
  semi: true,

  // 缩进字节数
  tabWidth: 2,

  // 缩进不使用tab，使用空格
  useTabs: false,

  // 箭头函数省略括号
  arrowParens: 'avoid',

  // 属性换行
  bracketSameLine: false,

  // react组件标签>单独一行
  jsxBracketSameLine: false,

  // 在对象或数组最后一个元素后面是否加逗号（在ES5中加尾逗号）
  trailingComma: 'all',

  // 在对象，数组括号与文字之间加空格 "{ foo: bar }"
  bracketSpacing: true,
};
