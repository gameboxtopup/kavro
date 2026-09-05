async function loadPackages() {

    try {

        const res = await fetch("https://kavro-api.onrender.com/api/product-items");

        const items = await res.json();

        const diamond = document.getElementById("diamond");

        diamond.innerHTML = "";

        items.forEach(item => {

            if (!item.product || item.product.slug !== "roblox") return;

            diamond.innerHTML += `
                <div class="package-item"
                    data-name="${item.title}"
                    data-price="NPR ${item.price}">

                    <div class="diamond">
                        🟩 ${item.title}
                    </div>

                    <div class="amount">
                        NPR ${item.price}
                    </div>

                </div>
            `;

        });

        initializeCards();

    } catch (err) {

        console.error(err);

    }

}

function initializeCards() {

    const packageItems = document.querySelectorAll(".package-item");

    packageItems.forEach(item => {

        item.onclick = () => {

            packageItems.forEach(i => i.classList.remove("active"));

            item.classList.add("active");

            document.getElementById("packageName").textContent =
                item.dataset.name;

            document.getElementById("packagePrice").textContent =
                item.dataset.price;

        };

    });

}

loadPackages();

document.getElementById("buyButton").onclick = function (e) {

    e.preventDefault();

    localStorage.setItem("selectedProduct", JSON.stringify({

        product: "Roblox",

        package: document.getElementById("packageName").textContent,

        price: document.getElementById("packagePrice").textContent

    }));

    window.location.href = "checkout.html";

};

document.getElementById("ctaBuyButton").onclick = document.getElementById("buyButton").onclick;
