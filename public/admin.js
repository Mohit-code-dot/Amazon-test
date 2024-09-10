const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");
const themeToggle = document.querySelector(".theme-toggler");
const ProductWrapper = document.querySelector(".ProductWrapper");
const ondashboard = document.querySelector("#ondashboard");
const adminMain = document.querySelector("#adminMain");
const AmazonProductTool = document.querySelector("#AmazonProductTool");
const sidebar = document.querySelectorAll(".sidebar a");

sidebar.forEach((value) => {
    value.addEventListener("click", () => {
        sidebar.forEach((link) => link.classList.remove("active"));
        value.classList.add("active");
    });
});

// show sidebar
menuBtn.addEventListener("click",()=>{
    sideMenu.style.display = "block";
})

// close sidebar
closeBtn.addEventListener("click",()=>{
    sideMenu.style.display = "none";
})

// Show dashboard
ondashboard.addEventListener("click",()=>{
    adminMain.style.display = "block";
    ProductWrapper.style.display = "none";
})
// Show Product
AmazonProductTool.addEventListener("click",()=>{
    ProductWrapper.style.display = "block";
    adminMain.style.display = "none";
})

// change theme
themeToggle.addEventListener("click",()=>{
    document.body.classList.toggle('dark-theme-variables');
    themeToggle.querySelector('i:nth-child(1)').classList.toggle('active');
    themeToggle.querySelector('i:nth-child(2)').classList.toggle('active');
})