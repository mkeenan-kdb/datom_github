let gridColumnCount = 0
let rowColumnCount = 0
var gridComputedStyle

function updateGridDimensions(){
  gridComputedStyle = window.getComputedStyle(document.getElementById("datom-grid-container"));
  gridRowCount = gridComputedStyle.getPropertyValue("grid-template-rows").split(" ").length;
  gridColumnCount = gridComputedStyle.getPropertyValue("grid-template-columns").split(" ").length;
}

function fillGrid(){
  updateGridDimensions();
  console.log(gridRowCount, gridColumnCount);
  for (let r = 1; r <= gridRowCount; r++) {
      for (let c = 1; c <= gridColumnCount; c++) {
          const h = document.createElement("div");
          h.addEventListener('click', function(e){
            e.target.style.backgroundColor = 'green';
            var itemxy = e.target.style.gridArea.split(" / ");
            var rown = Number(itemxy[0]);
            var coln = Number(itemxy[1]);
            newBox(rown,coln, 15, 7);
            console.log(e);
          });
          h.classList.add("highlight");
          h.style.gridRow = r;
          h.style.gridColumn = c;
          datomGridContainer.appendChild(h);
      }
  }
}
