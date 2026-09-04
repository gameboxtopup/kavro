document.addEventListener("DOMContentLoaded", () => {

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
