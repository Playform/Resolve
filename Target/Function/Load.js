const r=n=>{const o=f(process.cwd(),i.fileExists,n);if(!o)throw new c(r.name,n);const e=t(o);return s(m(o,i.readFile).config,i,e)};var g=r;import{dirname as t}from"path";import{sys as i,findConfigFile as f,parseJsonConfigFileContent as s,readConfigFile as m}from"typescript";import c from"@Class/Error/FileNotFound";export{r as _Function,g as default};
