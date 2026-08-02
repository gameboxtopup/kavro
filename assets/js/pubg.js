async function loadPackages() {

    try {

        const res = await fetch("http://localhost:5000/api/product-items");
        const items = await res.json();

        const container = document.getElementById("pubg-packages");

        container.innerHTML = "";

        items.forEach(item => {

            if (!item.product) return;

            if (item.product.slug !== "pubg") return;

            container.innerHTML += `
                <div class="package-item"
                    data-name="${item.title}"
                    data-price="NPR ${item.price}">

                    <div class="diamond">
                        ${item.title}
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

    const cards = document.querySelectorAll(".package-item");

    if (!cards.length) return;

    cards[0].classList.add("active");

    document.getElementById("packageName").textContent =
        cards[0].dataset.name;

    document.getElementById("packagePrice").textContent =
        cards[0].dataset.price;

    cards.forEach(card => {

        card.onclick = () => {

            cards.forEach(c => c.classList.remove("active"));

            card.classList.add("active");

            document.getElementById("packageName").textContent =
                card.dataset.name;

            document.getElementById("packagePrice").textContent =
                card.dataset.price;

        };

    });

}

loadPackages();

document.getElementById("buyButton").onclick = function (e) {

    e.preventDefault();

    localStorage.setItem("selectedProduct", JSON.stringify({

        product: "PUBG Mobile",

        package: document.getElementById("packageName").textContent,

        price: document.getElementById("packagePrice").textContent

    }));

    window.location.href = "checkout.html";

};