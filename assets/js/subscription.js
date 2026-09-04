const planContainer = document.getElementById("planContainer");

async function loadSubscription() {
    try {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get("slug");

        if (!slug) {
            planContainer.innerHTML = "<p>Subscription not found.</p>";
            return;
        }

        // Load product
        const productRes = await fetch(
            "https://kavro-api.onrender.com/api/products/slug/" +
            encodeURIComponent(slug)
        );

        if (!productRes.ok) {
            throw new Error("Product not found");
        }

        const product = await productRes.json();

        document.getElementById("productTitle").textContent =
            product.name;

        document.getElementById("productDescription").textContent =
            product.description || "";

        document.getElementById("productImage").src =
            product.image || "assets/images/logo.png";

        // Load product items
        const itemsRes = await fetch(
            "https://kavro-api.onrender.com/api/product-items"
        );

        const items = await itemsRes.json();

        planContainer.innerHTML = "";

        const plans = items.filter(item =>
            item.active &&
            item.product &&
            item.product._id === product._id
        );

        if (!plans.length) {
            planContainer.innerHTML =
                "<p>No subscription plans available.</p>";
            return;
        }

        plans.forEach(item => {

            planContainer.innerHTML += `
                <div class="plan-card"
                     data-title="${item.title}"
                     data-price="NPR ${item.price}">

                    <div class="plan-title">
                        ${item.title}
                    </div>

                    <div class="plan-price">
                        NPR ${item.price}
                    </div>

                </div>
            `;

        });

        initializePlans();

    } catch (error) {

        console.error("Subscription loading error:", error);

        planContainer.innerHTML =
            "<p>Unable to load subscription plans.</p>";
    }
}


function initializePlans() {

    const plans =
        document.querySelectorAll(".plan-card");

    const selectedPlan =
        document.getElementById("selectedPlan");

    const selectedPrice =
        document.getElementById("selectedPrice");

    const buyButton =
        document.getElementById("buyButton");

    const ctaBuy =
        document.getElementById("ctaBuy");


    plans.forEach(plan => {

        plan.addEventListener("click", function () {

            plans.forEach(p =>
                p.classList.remove("active")
            );

            this.classList.add("active");

            selectedPlan.textContent =
                this.dataset.title;

            selectedPrice.textContent =
                this.dataset.price;

        });

    });


    function buySubscription(e) {

        e.preventDefault();

        const activePlan =
            document.querySelector(".plan-card.active");

        if (!activePlan) {

            alert("Please select a subscription plan first.");

            return;
        }

        const params =
            new URLSearchParams(window.location.search);

        const slug =
            params.get("slug");

        localStorage.setItem(
            "selectedProduct",
            JSON.stringify({

                product:
                    document.getElementById("productTitle").textContent,

                slug: slug,

                package:
                    activePlan.dataset.title,

                price:
                    activePlan.dataset.price

            })
        );

        window.location.href =
            "subscription-order.html";

    }


    if (buyButton) {
        buyButton.addEventListener(
            "click",
            buySubscription
        );
    }

    if (ctaBuy) {
        ctaBuy.addEventListener(
            "click",
            buySubscription
        );
    }

}


loadSubscription();