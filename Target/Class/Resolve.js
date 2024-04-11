#!/usr/bin/env node
import{bold as t}from"ansi-colors";import{Logger as h}from"~/utils/logger";import{Step as P}from"~/utils/errors";import{createProgram as y}from"~/steps/createProgram";import{loadTSConfig as v}from"~/steps/loadTSConfig";import{resolvePaths as d}from"~/steps/resolvePaths";import{computeAliases as b}from"~/steps/computeAliases";import{getFilesToProcess as u}from"~/steps/getFilesToProcess";import{generateChanges as C}from"~/steps/generateChanges";import{applyChanges as E}from"~/steps/applyChanges";function w(){const s=y().parse().opts(),o=new h(s.verbose?"verbose":"info");o.verbose(),o.fancyParams("options",s);try{const r=v(s.project),{rootDir:m,outDir:p,baseUrl:f,paths:c}=r.options??{};o.fancyParams("compilerOptions",{rootDir:m,outDir:p,baseUrl:f,paths:c});const e=d(s,r);o.fancyParams("programPaths",e);const n=b(e.basePath,r?.options?.paths??{});o.fancyParams("aliases",n);const i=u(e.outPath,s.ext);o.fancyParams("filesToProcess",i);const a=C(i,n,e);o.fancyParams("fileChanges",a.map(({file:g,changes:l})=>({file:g,changes:l}))),s.noEmit?o.info(t("@playform/resolve:"),"discovered",a.length,"file(s) for change (none actually changed since --noEmit was given)"):(E(a),o.info(t("@playform/resolve:"),"changed",a.length,"file(s)"))}catch(r){if(r instanceof P)o.fancyError(`Error during step '${t(r.step)}'`,r.message);else throw r}}w();
