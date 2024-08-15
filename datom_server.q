\p 5000
-1"\nhttp://localhost:5000/datom.html\n";
\e 1
\d .dtom
PROJ_ROOT:"/Users/michael/q/projects/datom"
DB_ROOT:PROJ_ROOT,"/db"
HTML_ROOT:PROJ_ROOT,"/html_v1"
LAYOUTS:PROJ_ROOT,"/layouts"
HTML_FILE:HTML_ROOT,"/datom.html"
\d .

.h.HOME:"html_v1"

tilw:{x+til 1+y-x}

rmLibs:{
  dirs:enlist .dtom.HTML_ROOT,"/libs";
  if[not(0#`)~d:key h:hsym`$.dtom.LAYOUTS;dirs,:1_'string .Q.dd[h;]each (d,\:`libs)];
  @[system;;()]each"rm -r ",/:dirs;
  :dirs;
 }

addLibs:{
  dirs:rmLibs[];
  libdir:.dtom.PROJ_ROOT,"/libs";
  {@[system;" "sv("ln -s";x;y);{show x}];}[libdir;]each dirs;
 }

.dtom.htmlbreak:("<!--@KDB_BREAK_START@-->";"<!--@KDB_BREAK_END@-->")

.dtom.htmlrepl:{[html;newhtml]
 ri:where max flip{.dtom.htmlbreak~\:trim x}each html;
 start:tilw[0;ri[0]];
 end:tilw[ri[1];count[html]-1];
 :raze(html start;newhtml;html end);
 }

ldb:{
 system"l ",.dtom.DB_ROOT;
 system"cd ",.dtom.PROJ_ROOT;
 }

ldb[];

.req.saveLayout:{
 res:flip[enlist[`container]!string enlist[key x]],'uj/[enlist each value x];
 scripts:raze{{((x[`container],".",string[y]);x[y])}[x;]each `js`css`q`html}each res;
 newhtml:enlist"\n"sv res`txt;
 layout:([]filetime:enlist st:string .z.Z;data:enlist res);
 newdir:.dtom.PROJ_ROOT,"/layouts/datom_",st inter .Q.n;
 system"mkdir -p ",newdir;
 rmLibs[];
 system"cp -r ",.dtom.HTML_ROOT,"/* ",newdir;
 addLibs[];
 {show x 0: $[0>type first y;enlist y;y];}'[.Q.dd[hsym`$newdir,"/userfiles";]each`$scripts[;0];scripts[;1]];
 show(hsym`$newdir,"/userfiles/datom-containers.html")0: newhtml;
 layout:`filetime`dir xcols @[layout;`dir;:;enlist newdir];
 show(hsym`$.dtom.DB_ROOT,"/layout")upsert layout;
 ldb[];
 :1b;
 }

.req.getLayouts:{
  if[not`layout in key`.;:0b;];
  :layout;
 }

.req.changeLayout:{
  .h.HOME:.dtom.PROJ_ROOT,"/layouts/datom_",x inter .Q.n;
  :1b;
 }

.req.newLayout:{
  .h.HOME:"html";
  :1b;
 }

.req.handleReq:{
 endp:`$x`endp;
 res:0b;
 if[endp in key .req;res:value(`.req;endp;x`payl)];
 :res;
 }

.z.pp:{
 .web.ppx:x;
 data:x[0];head:x[1];
 handler:`$first s:"?"vs data;
 data:.j.k trim"?"sv 1_s;
 res:0b;
 if[handler in key .req;res:value(`.req;handler;data)];
 resp:.h.hy[`json;.j.j(`called`payl`resp)!(data`endp;data`payl;res)];
 :resp;
 }


\
.req.saveLayout:{
 boxes:x 0;
 scripts:x 1;
 scripts:update container:{last"_"vs x}'[box]from update box:string key[scripts]from value scripts;
 scripts:delete html from scripts; //html is already in the container text as it's in the DOM...
 scripts:raze{{(x[`container],".",string y;x[y])}[y;]each x}[`js`css`q;]each scripts;
 res:uj/[{`ID xcols update ID:count[i]#enlist[x]from((cols[y]except`txt),`txt)xcols y}'[key boxes;enlist each value boxes]];
 newhtml:enlist"\n"sv res`txt;
 layout:([]filetime:enlist st:string .z.Z;data:enlist res);
 newdir:.dtom.PROJ_ROOT,"/layouts/datom_",st inter .Q.n;
 {show x 0: $[0>type first y;enlist y;y];}'[.Q.dd[hsym`$newdir,"/userfiles";]each`$scripts[;0];scripts[;1]];
 system"mkdir -p ",newdir;
 rmLibs[];
 system"cp -r ",.dtom.HTML_ROOT,"/* ",newdir;
 addLibs[];
 show(hsym`$newdir,"/userfiles/datom-containers.html")0: newhtml;
 layout:`filetime`dir xcols @[layout;`dir;:;enlist newdir];
 show(hsym`$.dtom.DB_ROOT,"/layout")upsert layout;
 ldb[];
 :1b;
 }
