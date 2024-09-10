const dashboardHeading = (value) => {
  const AmazonTitle = document.getElementById("AmazonTitle");
  return (AmazonTitle.innerText = value);
};

const inputfield01 = document.getElementById("input-field01");
const inputfield02 = document.getElementById("input-field02");
const inputfield03 = document.getElementById("input-field03");
const inputfield04 = document.getElementById("input-field04");
const inputfield05 = document.getElementById("input-field05");
const inputfield06 = document.getElementById("input-field06");

inputfield01.addEventListener("change", (value) => {
  const AmazonSubTitle01 = document.getElementById("AmazonSubTitle01");
  AmazonSubTitle01.innerText = `•  ${value.target.value}`;
});
inputfield02.addEventListener("change", (value) => {
  const AmazonSubTitle02 = document.getElementById("AmazonSubTitle02");
  AmazonSubTitle02.innerText = `•  ${value.target.value}`;
});
inputfield03.addEventListener("change", (value) => {
  const AmazonSubTitle03 = document.getElementById("AmazonSubTitle03");
  AmazonSubTitle03.innerText = `•  ${value.target.value}`;
});
inputfield04.addEventListener("change", (value) => {
  const AmazonSubTitle04 = document.getElementById("AmazonSubTitle04");
  AmazonSubTitle04.innerText = `•  ${value.target.value}`;
});
inputfield05.addEventListener("change", (value) => {
  const AmazonSubTitle05 = document.getElementById("AmazonSubTitle05");
  AmazonSubTitle05.innerText = `•  ${value.target.value}`;
});
inputfield06.addEventListener("change", (value) => {
  const AmazonSubTitle06 = document.getElementById("AmazonSubTitle06");
  AmazonSubTitle06.innerText = `•  ${value.target.value}`;
});

function brandDetailInput(event){
  const Price = document.getElementById("Price");
  const detail01 = document.getElementById("detail01");
  const detail02 = document.getElementById("detail02");
  const detail03 = document.getElementById("detail03");
  const detail04 = document.getElementById("detail04");
  const detail05 = document.getElementById("detail05");

  if(event.target.id === "brandDetail-input0"){
    const brandDetail = document.getElementById("brandDetail-input0").value;
    Price.innerText = brandDetail;
  }
  if(event.target.id === "brandDetail-input01"){
    const brandDetail = document.getElementById("brandDetail-input01").value;
    detail01.innerText = brandDetail;
  }
  if(event.target.id === "brandDetail-input02"){
    const brandDetail = document.getElementById("brandDetail-input02").value;
    detail02.innerText = brandDetail;
  }
  if(event.target.id === "brandDetail-input03"){
    const brandDetail = document.getElementById("brandDetail-input03").value;
    detail03.innerText = brandDetail;
  }
  if(event.target.id === "brandDetail-input04"){
    const brandDetail = document.getElementById("brandDetail-input04").value;
    detail04.innerText = brandDetail;
  }
  if(event.target.id === "brandDetail-input05"){
    const brandDetail = document.getElementById("brandDetail-input05").value;
    detail05.innerText = brandDetail;
  }
}

  const cross = document.querySelector("#cross");
  cross.addEventListener('click',()=>{
    const app = document.querySelector(".app");
    app.style.display = "none";
  })

  function uploadImage(){
    const app = document.querySelector(".app");
    app.style.display = "flex";
  }

function removeSideMenu(){
  const dashboard = document.querySelector(".dashboard");
  const sideMenu = document.querySelector(".sideMenu");
  dashboard.style.transition = "all .5s";
  dashboard.style.width = "0"
  dashboard.style.right = "-100%"
  sideMenu.style.display = "flex"
}


  


