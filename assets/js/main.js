/* ==========================================
   KAVRO MAIN.JS
   Version 1.0
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================
       MOBILE MENU
    ========================== */

    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuBtn && navLinks) {

        menuBtn.addEventListener("click", () => {

            navLinks.classList.toggle("show");

        });

        navLinks.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                navLinks.classList.remove("show");

            });

        });

    }

    /* ==========================
       ACTIVE NAVIGATION
    ========================== */

    const currentPage = location.pathname.split("/").pop();

    document.querySelectorAll(".nav-links a").forEach(link => {

        const href = link.getAttribute("href");

        if (href === currentPage || (currentPage === "" && href === "index.html")) {

            link.classList.add("active");

        }

    });

    /* ==========================
       SMOOTH SCROLL
    ========================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function(e) {

            const target = document.querySelector(this.getAttribute("href"));

            if (target) {

                e.preventDefault();

                target.scrollIntoView({

                    behavior: "smooth"

                });

            }

        });

    });

    /* ==========================
       NEWSLETTER VALIDATION
    ========================== */

    const newsletter = document.querySelector(".newsletter form");

    if (newsletter) {

        newsletter.addEventListener("submit", function(e) {

            e.preventDefault();

            const email = this.querySelector("input").value.trim();

            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!regex.test(email)) {

                alert("Please enter a valid email address.");

                return;

            }

            alert("Thank you for subscribing!");

            this.reset();

        });

    }

    /* ==========================
       SCROLL REVEAL
    ========================== */

    const revealItems = document.querySelectorAll(

        ".trusted-card,.service-card,.product-card,.game-card,.why-card,.faq-item"

    );

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.style.opacity = "1";

                entry.target.style.transform = "translateY(0px)";

            }

        });

    }, {

        threshold:0.15

    });

    revealItems.forEach(item => {

        item.style.opacity = "0";

        item.style.transform = "translateY(40px)";

        item.style.transition = ".6s ease";

        observer.observe(item);

    });

});


/* ==========================
   STICKY HEADER
========================== */

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (!header) return;

    if (window.scrollY > 50) {

        header.style.background = "rgba(255,255,255,.98)";

        header.style.boxShadow = "0 15px 35px rgba(0,0,0,.08)";

    }

    else{

        header.style.background = "rgba(255,255,255,.88)";

        header.style.boxShadow = "none";

    }

});


/* ==========================
   BACK TO TOP BUTTON
========================== */

const topButton = document.createElement("button");

topButton.innerHTML = "↑";

topButton.id = "backToTop";

document.body.appendChild(topButton);

Object.assign(topButton.style,{

position:"fixed",

bottom:"25px",

right:"25px",

width:"50px",

height:"50px",

borderRadius:"50%",

border:"none",

background:"#2563eb",

color:"#fff",

fontSize:"22px",

cursor:"pointer",

display:"none",

zIndex:"9999",

boxShadow:"0 10px 25px rgba(0,0,0,.15)",

transition:".3s"

});

window.addEventListener("scroll",()=>{

if(window.scrollY>400){

topButton.style.display="block";

}

else{

topButton.style.display="none";

}

});

topButton.onclick=()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

};


/* ==========================
   CURRENT YEAR
========================== */

const year=document.querySelector(".copyright");

if(year){

year.innerHTML=`© ${new Date().getFullYear()} Kavro. All Rights Reserved.`;

}


/* ==========================
   PAGE LOADER EFFECT
========================== */

window.addEventListener("load",()=>{

document.body.style.opacity="0";

setTimeout(()=>{

document.body.style.transition="opacity .5s ease";

document.body.style.opacity="1";

},100);

});


/* ==========================
   CONSOLE MESSAGE
========================== */

console.log("%cKAVRO LOADED SUCCESSFULLY","color:#2563eb;font-size:18px;font-weight:bold;");