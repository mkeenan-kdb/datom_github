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

/ filetime of the layout currently being served; "" means the blank html/ one.
.dtom.current:""

/ A layout snapshot dir is the only thing here allowed to be removed, and only
/ ever under layouts/. Every rm -rf in this file goes through here.
.dtom.rmLayoutDir:{
  if[not x like .dtom.LAYOUTS,"/datom_*";'"refusing to remove ",x];
  system"rm -rf ",x;
 }

/ Only digits survive, so nothing from the client can escape layouts/. An empty
/ id would resolve to the bare "datom_" dir, so reject it rather than rm that.
.dtom.layoutDir:{
  if[not count d:x inter .Q.n;'"bad layout id: ",x];
  .dtom.LAYOUTS,"/datom_",d
 }

/ payl: {boxes:{...}; target:"<filetime>"}. An empty target creates a new
/ layout; otherwise the named one is rewritten in place, so editing a saved
/ layout and hitting save updates it instead of spawning a copy each time.
.req.saveLayout:{
 boxes:x`boxes;
 target:x`target;
 st:$[count target;target;string .z.Z];
 res:flip[enlist[`container]!string enlist[key boxes]],'uj/[enlist each value boxes];
 scripts:raze{{((x[`container],".",string[y]);x[y])}[x;]each `js`css`q`html}each res;
 newhtml:enlist"\n"sv res`txt;
 newdir:.dtom.layoutDir st;
 .dtom.rmLayoutDir newdir;  / clean slate: else files for deleted boxes linger
 system"mkdir -p ",newdir;
 system"cp -r ",.dtom.HTML_ROOT,"/* ",newdir;
 system"mkdir -p ",newdir,"/userfiles";  / after the copy, else cp nests it
 / split on newline so multi-line code is written as real lines, not one blob
 {x 0: "\n" vs y;}'[.Q.dd[hsym`$newdir,"/userfiles";]each`$scripts[;0];scripts[;1]];
 (hsym`$newdir,"/userfiles/datom-containers.html")0: newhtml;
 row:([]filetime:enlist st;dir:enlist newdir;data:enlist res);
 / rewrite the whole table: upsert on a flat file appends, it cannot replace
 (hsym`$.dtom.DB_ROOT,"/layout")set $[`layout in key`.;
   (delete from layout where filetime~\:st),row;
   row];
 .h.HOME:newdir;      / you are now editing the layout you just saved
 .dtom.current:st;
 ldb[];
 :st;  / the filetime, so the client can refresh and select it
 }

.req.deleteLayout:{
 if[not $[`layout in key`.;any layout[`filetime]~\:x;0b];'"no such layout: ",x];
 .dtom.rmLayoutDir .dtom.layoutDir x;
 if[`layout in key`.;
   (hsym`$.dtom.DB_ROOT,"/layout")set delete from layout where filetime~\:x];
 if[.dtom.current~x;.dtom.current:"";.h.HOME:"html"];  / dropped the one on screen
 ldb[];
 :1b;
 }

/ current lets the page reopen the dropdown on whatever layout is being served
.req.getLayouts:{`layouts`current!($[`layout in key`.;layout;()];.dtom.current)}

/ Run a box's q tab and hand the result back as JSON. .j.j already flattens
/ tables and unkeys `by` results, and .z.pp traps and reports errors, so plain
/ value covers multi-line, comments and blank lines with nothing added.
/ This is arbitrary evaluation in this process by design -- it is the feature.
/ Keep the port on localhost.
.req.runQ:{value x}

.req.changeLayout:{
  .h.HOME:.dtom.layoutDir x;
  .dtom.current:x;
  :1b;
 }

.req.newLayout:{
  .h.HOME:"html";
  .dtom.current:"";
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


