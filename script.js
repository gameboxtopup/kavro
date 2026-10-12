/* Load the public shop-hours gate on every storefront page using this shared script. */
(function loadKavroShopHours() {
    if (document.querySelector('script[data-kavro-shop-hours]')) return;
    const gateScript = document.createElement("script");
    gateScript.src = "assets/js/shop-hours.js";
    gateScript.dataset.kavroShopHours = "true";
    document.head.appendChild(gateScript);
})();

(function loadKavroWallet() {
    if (document.querySelector('script[data-kavro-wallet]')) return;
    const walletScript = document.createElement("script");
    walletScript.src = "assets/js/kavro-wallet.js";
    walletScript.dataset.kavroWallet = "true";
    document.head.appendChild(walletScript);
})();

document.addEventListener("DOMContentLoaded", () => {

    // Show a one-time animated review prompt when a customer's order is completed.
    const reviewToken = localStorage.getItem("kavroToken");
    if (reviewToken && !document.getElementById("kavroReviewPopup")) {
        const style = document.createElement("style");
        style.textContent = `
            @keyframes kavroReviewPop { from { opacity:0; transform:translate(-50%,20px) scale(.92); } to { opacity:1; transform:translate(-50%,0) scale(1); } }
            .kavro-review-popup { position:fixed; z-index:99999; left:50%; bottom:24px; width:min(420px,calc(100% - 28px)); padding:22px; border:1px solid #60a5fa; border-radius:18px; background:#101d35; color:#f8fafc; box-shadow:0 20px 60px #0009; animation:kavroReviewPop .35s ease-out; }
            .kavro-review-popup h3 { margin:0 0 8px; font-size:20px; }
            .kavro-review-popup p { margin:0 0 16px; color:#cbd5e1; line-height:1.5; }
            .kavro-review-actions { display:flex; gap:10px; }
            .kavro-review-popup textarea,.kavro-review-popup select { width:100%; margin:8px 0; padding:10px; border:1px solid #475569; border-radius:8px; background:#081225; color:#fff; }
            .kavro-review-actions button { flex:1; border:0; border-radius:9px; padding:11px; font-weight:700; cursor:pointer; }
            .kavro-review-actions button:first-child { background:#2563eb; color:#fff; }
            .kavro-review-actions button:last-child { background:#263754; color:#cbd5e1; }
        `;
        document.head.appendChild(style);

        fetch("https://kavro-api.onrender.com/api/orders/my-orders", {
            headers: { Authorization: `Bearer ${reviewToken}` }
        })
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                const orders = data?.orders || data?.data || [];
                const completed = orders.find(order =>
                    ["completed", "delivered"].includes(String(order.status || "").toLowerCase()) &&
                    !localStorage.getItem(`kavroReviewedPrompt:${order._id}`)
                );
                if (!completed) return;

                const popup = document.createElement("div");
                popup.id = "kavroReviewPopup";
                popup.className = "kavro-review-popup";
                popup.innerHTML = `
                    <h3>🎉 Your order is complete!</h3>
                    <p>Your ${completed.product || "Kavro"} order has been delivered. Please share your experience with us.</p>
                    <select id="kavroReviewRating"><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Very good</option><option value="3">★★★ Good</option><option value="2">★★ Needs improvement</option><option value="1">★ Poor</option></select>
                    <textarea id="kavroReviewComment" rows="3" placeholder="Write your review..."></textarea>
                    <div class="kavro-review-actions">
                        <button type="button" id="submitKavroReview">Submit Review</button>
                        <button type="button">Later</button>
                    </div>
                `;
                document.body.appendChild(popup);
                popup.querySelector("#submitKavroReview").onclick = async () => {
                    const comment = popup.querySelector("#kavroReviewComment").value.trim();
                    if (comment.length < 3) { alert("Please write a short review first."); return; }
                    const response = await fetch("https://kavro-api.onrender.com/api/reviews", { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${reviewToken}`}, body:JSON.stringify({ orderId:completed._id, rating:Number(popup.querySelector("#kavroReviewRating").value), comment }) });
                    const result = await response.json();
                    if (!response.ok || !result.success) { alert(result.message || "Could not submit review."); return; }
                    localStorage.setItem(`kavroReviewedPrompt:${completed._id}`, "1");
                    popup.remove();
                };
                popup.querySelector(".kavro-review-actions button:last-child").onclick = () => {
                    localStorage.setItem(`kavroReviewedPrompt:${completed._id}`, "1");
                };
            })
            .catch(() => {});
    }

    /* =========================
       MOBILE NAVIGATION
    ========================= */

    const menu = document.querySelector(".menu-btn");
    const nav = document.querySelector(".nav-links");

    if (menu && nav) {

        menu.addEventListener("click", () => {
            nav.classList.toggle("open");
        });

        nav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                nav.classList.remove("open");
            });
        });

    }


    /* =========================
       PRODUCT SEARCH + FILTER
    ========================= */

    const searchInput = document.getElementById("searchInput");
    const buttons = document.querySelectorAll(".category-btn");
    const cards = document.querySelectorAll(".product-card");
    const grid = document.querySelector(".product-grid");

    if (grid && cards.length) {

        let currentCategory = "all";

        const message = document.createElement("p");

        message.textContent = "No products found.";

        message.style.cssText = `
            text-align:center;
            color:#667085;
            padding:55px 0;
            display:none;
            grid-column:1/-1;
        `;

        grid.appendChild(message);


        function filterProducts() {

            const search = searchInput
                ? searchInput.value.toLowerCase().trim()
                : "";

            let visible = 0;


            cards.forEach(card => {

                const category =
                    (card.dataset.category || "").toLowerCase();

                const keywords =
                    (
                        card.dataset.search ||
                        card.textContent ||
                        ""
                    ).toLowerCase();


                const categoryMatch =
                    currentCategory === "all" ||
                    category === currentCategory;


                const searchMatch =
                    !search ||
                    keywords.includes(search);


                const show =
                    categoryMatch &&
                    searchMatch;


                card.style.display =
                    show ? "" : "none";


                if (show) {
                    visible++;
                }

            });


            message.style.display =
                visible ? "none" : "block";

        }


        /* Search */

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterProducts
            );

        }


        /* Categories */

        buttons.forEach(button => {

            button.addEventListener("click", () => {

                buttons.forEach(btn => {
                    btn.classList.remove("active");
                });


                button.classList.add("active");


                currentCategory =
                    button.dataset.category || "all";


                filterProducts();

            });

        });


        filterProducts();

    }



    /* =========================
       PACKAGE TABS
    ========================= */

    const tabs =
        document.querySelectorAll(".tab-btn");

    const contents =
        document.querySelectorAll(".package-content");


    tabs.forEach(tab => {

        tab.addEventListener("click", event => {

            event.preventDefault();


            tabs.forEach(btn => {
                btn.classList.remove("active");
            });


            contents.forEach(content => {
                content.classList.remove("active");
            });


            tab.classList.add("active");


            const target =
                document.getElementById(
                    tab.dataset.tab
                );


            if (target) {
                target.classList.add("active");
            }

        });

    });



    /* =========================
       PACKAGE SELECTION
    ========================= */

    const items =
        document.querySelectorAll(".package-item");

    const packageName =
        document.getElementById("packageName");

    const packagePrice =
        document.getElementById("packagePrice");


    items.forEach(item => {

        item.addEventListener("click", event => {

            event.preventDefault();


            items.forEach(card => {
                card.classList.remove("active");
            });


            item.classList.add("active");


            /* Package name */

            if (packageName) {

                const name =
                    item.dataset.name ||
                    item.querySelector("strong,h3")?.textContent ||
                    "";

                packageName.textContent =
                    name.trim();

            }


            /* Package price */

            if (packagePrice) {

                const price =
                    item.dataset.price ||
                    item.querySelector(".price")?.textContent ||
                    "";

                packagePrice.textContent =
                    price.trim();

            }

        });

    });



    /* =========================
       BUY NOW → ORDER PAGE
    ========================= */

    const buyButton =
        document.getElementById("buyButton");


    if (
        buyButton &&
        packageName &&
        packagePrice
    ) {

        buyButton.addEventListener(
            "click",
            event => {

                // Dynamic product pages (including UniPin) build their own
                // complete checkout URL with item ID, unit price and quantity.
                // Do not overwrite that URL with the legacy Free Fire link.
                if (window.selectedProductItem) {
                    return;
                }

                event.preventDefault();


                let product =
                    window.PRODUCT_NAME ||
                    "Free Fire";


                /* Detect product page */

                if (
                    window.location.pathname
                        .toLowerCase()
                        .includes("pubg")
                ) {

                    product =
                        "PUBG Mobile";

                }

                else if (
                    window.location.pathname
                        .toLowerCase()
                        .includes("roblox")
                ) {

                    product =
                        "Roblox";

                }

                else if (
                    window.location.pathname
                        .toLowerCase()
                        .includes("steam")
                ) {

                    product =
                        "Steam Gift Card Global";

                }

                else if (
                    window.location.pathname
                        .toLowerCase()
                        .includes("freefire")
                ) {

                    product =
                        "Free Fire";

                }


                const url =
                    "order.html?product=" +
                    encodeURIComponent(product) +

                    "&package=" +
                    encodeURIComponent(
                        packageName.textContent.trim()
                    ) +

                    "&price=" +
                    encodeURIComponent(
                        packagePrice.textContent.trim()
                    );


                window.location.href =
                    url;

            }
        );

    }



    /* =========================
       SCROLL REVEAL ANIMATION
    ========================= */

    const revealTargets =
        document.querySelectorAll(
            `
            .section-heading,
            .product-card,
            .payment-card,
            .why-card,
            .faq-item,
            .order-box,
            .ff-left,
            .ff-right
            `
        );


    revealTargets.forEach(element => {

        element.classList.add("reveal");

    });


    if (
        "IntersectionObserver"
        in window
    ) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target
                                .classList
                                .add("visible");


                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.08
                }
            );


        revealTargets.forEach(element => {

            observer.observe(element);

        });

    }

    else {

        revealTargets.forEach(element => {

            element.classList.add("visible");

        });

    }

});
