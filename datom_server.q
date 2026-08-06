\p 5002
-1"\nhttp://localhost:5002/datom.html\n";
\e 1
\d .dtom
PROJ_ROOT:first system"pwd"
DB_ROOT:PROJ_ROOT,"/db"
HTML_ROOT:PROJ_ROOT,"/html"
LAYOUTS:PROJ_ROOT,"/layouts"
HTML_FILE:HTML_ROOT,"/datom.html"
if[not(`$"datom.html")in key hsym`$HTML_ROOT;'"start datom from the repo root: no ",HTML_FILE];
\d .

/ .h.HOME defaults to "html" relative to cwd, which ldb[] sets to PROJ_ROOT

/ rmLibs/addLibs lived here to symlink a vendored libs/ into every layout
/ snapshot. ace and apexcharts come from a CDN now, so both are gone -- and
/ with them the "rm -r" built from a hardcoded path.

ldb:{
 system"mkdir -p ",.dtom.DB_ROOT;  / db/ is generated, not checked in
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
 system"cp -r ",.dtom.HTML_ROOT,"/* ",newdir;
 system"mkdir -p ",newdir,"/userfiles";  / after the copy, else cp nests it
 / split on newline so multi-line code is written as real lines, not one blob
 {show x 0: "\n" vs y;}'[.Q.dd[hsym`$newdir,"/userfiles";]each`$scripts[;0];scripts[;1]];
 show(hsym`$newdir,"/userfiles/datom-containers.html")0: newhtml;
 layout:`filetime`dir xcols @[layout;`dir;:;enlist newdir];
 show(hsym`$.dtom.DB_ROOT,"/layout")upsert layout;
 ldb[];
 :st;  / the new filetime, so the client can refresh and select it
 }

.req.getLayouts:{$[`layout in key`.;layout;()]}  / () -> [] so an empty db is not an error

.req.changeLayout:{
  .h.HOME:.dtom.PROJ_ROOT,"/layouts/datom_",x inter .Q.n;
  :1b;
 }

.req.newLayout:{
  .h.HOME:"html";
  :1b;
 }

/ Single POST endpoint: /handleReq with {"endp":"...","payl":...}, dispatched
/ on endp. kdb hands .z.pp x[0] as "<url> <body>" -- a SPACE, not the "?" the
/ old parse split on, so every request used to die in .j.k with 'partial token.
.z.pp:{
 .web.ppx:x;
 data:.j.k trim" "sv 1_" "vs x 0;
 endp:`$data`endp;
 .dtom.lastErr:$[endp in key .req;"";"no handler: ",data`endp];
 res:$[count .dtom.lastErr;0b;@[value(`.req;endp);data`payl;{.dtom.lastErr:x;0b}]];
 if[count .dtom.lastErr;-1"REQ ERROR (",data[`endp],"): ",.dtom.lastErr];
 :.h.hy[`json;.j.j`called`payl`resp`err!(data`endp;data`payl;res;.dtom.lastErr)];
 }


