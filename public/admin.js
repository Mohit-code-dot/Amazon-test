const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");
const themeToggle = document.querySelector(".theme-toggler");
const sidebar = document.querySelectorAll(".sidebar a");
const sidebarh3 = document.querySelectorAll(".sidebar a h3");
const recentOrder = document.querySelector(".recent-orders")
const dashboard = document.querySelector(".dashboard")

sidebar.forEach((value) => {
    value.addEventListener("click", () => {
        sidebar.forEach((link) => link.classList.remove("active"));
        value.classList.add("active");
        // value.childNodes.forEach((element)=>{
        //     if(element.textContent === "Generate Preview Links"){
        //         recentOrder.style.display = "none";
        //         dashboard.style.display = "flex";
        //     }
        //     else{
        //         recentOrder.style.display = "block";
        //         dashboard.style.display = "none";
        //     }
        // })
    });
});

function showDashboard(){
    dashboard.style.display = "flex";
    recentOrder.style.display = "none";
}
function hideDashboard(){
    dashboard.style.display = "none";
    recentOrder.style.display = "block";
}


// // show sidebar
// menuBtn.addEventListener("click",()=>{
//     sideMenu.style.display = "block";
// })

// // close sidebar
// closeBtn.addEventListener("click",()=>{
//     sideMenu.style.display = "none";
// })

// // Show dashboard
// ondashboard.addEventListener("click",()=>{
//     adminMain.style.display = "block";
//     ProductWrapper.style.display = "none";
// })
// // Show Product
// AmazonProductTool.addEventListener("click",()=>{
//     ProductWrapper.style.display = "block";
//     adminMain.style.display = "none";
// })

// change theme
themeToggle.addEventListener("click",()=>{
    document.body.classList.toggle('dark-theme-variables');
    themeToggle.querySelector('i:nth-child(1)').classList.toggle('active');
    themeToggle.querySelector('i:nth-child(2)').classList.toggle('active');
})