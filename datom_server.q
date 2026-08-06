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

/ .h.HOME defaults to "html" relative to cwd, which the boot below sets to PROJ_ROOT

/ rmLibs/addLibs lived here to symlink a vendored libs/ into every layout
/ snapshot. ace and apexcharts come from a CDN now, so both are gone -- and
/ with them the "rm -r" built from a hardcoded path.

system"mkdir -p ",.dtom.DB_ROOT," ",.dtom.LAYOUTS;  / both are generated, not checked in
system"l ",.dtom.DB_ROOT;
system"cd ",.dtom.PROJ_ROOT;

/ Demo data for the example dashboard in layouts/example. Skipped entirely if
/ you already have a `trade` -- a real one loaded from db/ wins. The seed is
/ fixed so every box in the layout agrees, and reloads do not reshuffle. Built
/ inside a lambda so only `trade` lands in the namespace you query from.
if[not `trade in key `.;
  trade:{[]
    system"S 42";
    bases:`AAPL`MSFT`NVDA`AMZN`GOOG`META`TSLA!214.3 402.1 121.9 178.6 165.2 495.7 248.9;
    s:(n:2000)?key bases;
    ([]
      time:asc 09:30:00.000+n?06:30:00.000;
      sym:s;
      side:n?`buy`buy`sell;  / weighted, so the buy/sell box is not a flat 50/50
      size:10*1+n?200;
      px:0.01*"j"$100*bases[s]*1+0.02*-1+n?2.0)}[];
 ];

/ name of the layout currently being served; "" means the blank html/ one.
.dtom.current:""

/ A layout is a directory under layouts/ named after the dashboard, so the name
/ IS the id and the disk is the only source of truth -- there is no db table to
/ drift out of sync with what is actually there. Only these characters survive,
/ so nothing from the client can escape layouts/, and an empty name is rejected
/ rather than resolving to the layouts dir itself.
.dtom.layoutName:{
  if[not count n:((),x)inter .Q.an,"-";'"bad layout name: ",x];
  n
 }

.dtom.layoutDir:{.dtom.LAYOUTS,"/",.dtom.layoutName x}

/ Same, but for a layout that has to be there already: saveLayout is the only
/ thing allowed to create one. Without this, opening a name that does not exist
/ quietly built an empty layout dir and served it.
.dtom.existingLayout:{
  if[not any .dtom.layouts[]~\:.dtom.layoutName x;'"no such layout: ",x];
  .dtom.layoutDir x
 }

/ A layout dir is the only thing allowed to be removed, and only ever a direct
/ child of layouts/: the path has to be exactly what layoutDir would build from
/ its own basename. Every rm -rf in this file goes through here.
.dtom.rmLayoutDir:{
  if[not x~.dtom.layoutDir last "/" vs x;'"refusing to remove ",x];
  system"rm -rf ",x;
 }

/ Layout names on disk. Anything that is not a directory (.DS_Store, say) is
/ ignored rather than offered as a layout.
.dtom.layouts:{
  if[not count d:key h:hsym`$.dtom.LAYOUTS;:()];
  string d where 11h=type each key each .Q.dd[h]each d
 }

/ Copy the app into a layout dir -- everything in html/ except userfiles/, which
/ is the layout's own content and would be clobbered by html/'s empty one. Only
/ runs when the dir has no datom.html, so a saved layout keeps the copy it was
/ saved with and old layouts survive changes to the app.
/ It also means a layout can ship as nothing but its userfiles/, which is how
/ layouts/example lives in git without a checked-in duplicate of html/.
.dtom.hydrate:{
  system"mkdir -p ",x,"/userfiles";
  if[not(`$"datom.html")in key hsym`$x;
    f:string key[hsym`$.dtom.HTML_ROOT]except`userfiles;
    system"cp -r ",(" "sv .dtom.HTML_ROOT,/:"/",/:f)," ",x];
  x
 }

/ payl: {boxes:{...}; name:"my-dashboard"}. Saving under a name that already
/ exists rewrites that layout in place, so editing a saved layout and hitting
/ save updates it instead of spawning a copy each time.
.req.saveLayout:{
 boxes:x`boxes;
 name:.dtom.layoutName x`name;
 res:flip[enlist[`container]!string enlist[key boxes]],'uj/[enlist each value boxes];
 scripts:raze{{((x[`container],".",string[y]);x[y])}[x;]each `js`css`q`html}each res;
 newhtml:enlist"\n"sv res`txt;
 newdir:.dtom.LAYOUTS,"/",name;
 .dtom.rmLayoutDir newdir;  / clean slate: else files for deleted boxes linger
 .dtom.hydrate newdir;
 / split on newline so multi-line code is written as real lines, not one blob
 {x 0: "\n" vs y;}'[.Q.dd[hsym`$newdir,"/userfiles";]each`$scripts[;0];scripts[;1]];
 (hsym`$newdir,"/userfiles/datom-containers.html")0: newhtml;
 .h.HOME:newdir;      / you are now editing the layout you just saved
 .dtom.current:name;
 :name;  / the name it landed under, so the client can refresh and select it
 }

.req.deleteLayout:{
 .dtom.rmLayoutDir .dtom.existingLayout x;
 / dropped the one on screen: fall back to the blank canvas
 if[.dtom.current~.dtom.layoutName x;.dtom.current:"";.h.HOME:"html"];
 :1b;
 }

/ current lets the page reopen the dropdown on whatever layout is being served
.req.getLayouts:{`layouts`current!(.dtom.layouts[];.dtom.current)}

/ Run a box's q tab and hand the result back as JSON. .j.j already flattens
/ tables and unkeys `by` results, and .z.pp traps and reports errors, so plain
/ value covers multi-line, comments and blank lines with nothing added.
/ This is arbitrary evaluation in this process by design -- it is the feature.
/ Keep the port on localhost.
.req.runQ:{value x}

.req.changeLayout:{
  .h.HOME:.dtom.hydrate .dtom.existingLayout x;
  .dtom.current:.dtom.layoutName x;
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
