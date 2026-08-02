document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("searchInput");
    const buttons = document.querySelectorAll(".category-btn");
    const cards = document.querySelectorAll(".product-card");

    let currentCategory = "all";

    // No products message
    const message = document.createElement("h3");
    message.textContent = "No products found.";
    message.style.textAlign = "center";
    message.style.margin = "50px 0";
    message.style.color = "#64748b";
    message.style.display = "none";

    const grid = document.querySelector(".product-grid");
    if(grid){
        grid.after(message);
    }

    function filterProducts(){

        const search = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

        let visible = 0;

        cards.forEach(card=>{

            const category = (card.dataset.category || "").toLowerCase();
            const keywords = (card.dataset.search || "").toLowerCase();

            const categoryMatch =
                currentCategory === "all" ||
                category === currentCategory;

            const searchMatch =
                search === "" ||
                keywords.includes(search);

            if(categoryMatch && searchMatch){

                card.style.display = "block";
                visible++;

            }else{

                card.style.display = "none";

            }

        });

        if(message){

            message.style.display = visible ? "none" : "block";

        }

    }

    // Search
    if(searchInput){

        searchInput.addEventListener("input", filterProducts);

    }

    // Category buttons
    buttons.forEach(button => {

    button.addEventListener("click", () => {

        buttons.forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        currentCategory = button.dataset.category;

        filterProducts();

    });

});
    filterProducts();

});

document.addEventListener("DOMContentLoaded", function () {

    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".package-content");
    const items = document.querySelectorAll(".package-item");

    const packageName = document.getElementById("packageName");
    const packagePrice = document.getElementById("packagePrice");

    // Initialize tabs only if they exist
if (tabs.length) {

    tabs.forEach(tab => {

        tab.addEventListener("click", function (e) {

            e.preventDefault();

            tabs.forEach(btn => btn.classList.remove("active"));
            contents.forEach(box => box.classList.remove("active"));

            this.classList.add("active");

            const target = document.getElementById(this.dataset.tab);

            if (target) target.classList.add("active");

        });

    });

}

// Initialize package selection if packages exist
if (items.length) {

    items.forEach(item => {

        item.addEventListener("click", function (e) {

            e.preventDefault();

            items.forEach(card => card.classList.remove("active"));

            this.classList.add("active");

            if (packageName) packageName.textContent = this.dataset.name;
            if (packagePrice) packagePrice.textContent = this.dataset.price;

        });

    });

}

    // Tabs
    tabs.forEach(tab => {

        tab.addEventListener("click", function (e) {

    e.preventDefault();

            tabs.forEach(btn => btn.classList.remove("active"));
            contents.forEach(box => box.classList.remove("active"));

            this.classList.add("active");

            const target = document.getElementById(this.dataset.tab);

            if (target) target.classList.add("active");

        });

    });

    // Package selection
items.forEach(item => {

    item.addEventListener("click", function (e) {

        e.preventDefault();

        items.forEach(card => card.classList.remove("active"));

        this.classList.add("active");

        if (packageName) {
            packageName.textContent = this.dataset.name;
        }

        if (packagePrice) {
            packagePrice.textContent = this.dataset.price;
        }

    });

});

});
/* ===========================
   BUY NOW -> ORDER PAGE
=========================== */

document.addEventListener("DOMContentLoaded", function () {

    const buyButton = document.getElementById("buyButton");
    const packageName = document.getElementById("packageName");
    const packagePrice = document.getElementById("packagePrice");
    const mobilePackage = document.getElementById("mobilePackage");

    if (mobilePackage && packageName && packagePrice) {
        mobilePackage.textContent =
            packageName.textContent + " • " + packagePrice.textContent;
    }

    if (buyButton && packageName && packagePrice) {

        buyButton.addEventListener("click", function (e) {

            e.preventDefault();

            let product = "Free Fire";

            if (window.location.pathname.includes("pubg")) {
                product = "PUBG Mobile";
            } else if (window.location.pathname.includes("roblox")) {
                product = "Roblox";
            }

            const url =
                "order.html?product=" +
                encodeURIComponent(product) +
                "&package=" +
                encodeURIComponent(packageName.textContent.trim()) +
                "&price=" +
                encodeURIComponent(packagePrice.textContent.trim());

            window.location.href = url;

        });

    }

});