1. use `@vue/component-compiler-utils` to extract template render function
   and script content
2. use @babel/parser to parse the two js parse into es6 AST
3. use @babel/traverse to traverse the AST and extract for types of translation
   clauses

   n.b.

   we can also use @vue/compiler-sfc to exract contents

   ```js
   if (type === 'vue') {
     const {parse, compileTemplate} = require('@vue/compiler-sfc');
     const vueFile = parse(data).descriptor;
      if (vueFile.script) {
       contents.push({
         content: vueFile.script.content.trim(),
         lang: vueFile.script.lang || 'js',
       });
     }
      if (vueFile.template) {
       const vueTemplate = compileTemplate({source: vueFile.template.content});
        contents.push({
         content: vueTemplate.code,
         lang: 'js',
       });
     }
   }
   ```

4. generate a virtual file and use `xgettext` to extract translations from
   the file and create a pot template
5. generate po files from pot template
6. translate po files
7. generate JSON translation definitions and load into Vue project
8. implement the four translation helpers as prototype methods on Vue
