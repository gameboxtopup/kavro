const API_URL = "https://kavro-api.onrender.com";


// ==========================================
// LOAD PRODUCT ITEMS
// ==========================================

async function loadProductItems() {

    try {

        // ==========================================
        // 1. CHECK PRODUCT SLUG
        // ==========================================

        if (typeof PRODUCT_SLUG === "undefined") {

            console.error(
                "PRODUCT_SLUG is not defined."
            );

            return;
        }


        // ==========================================
        // 2. GET ALL PRODUCTS
        // ==========================================

        const productResponse = await fetch(
            `${API_URL}/api/products`
        );


        if (!productResponse.ok) {

            throw new Error(
                "Failed to load products"
            );

        }


        const products =
            await productResponse.json();


        // ==========================================
        // 3. FIND CURRENT PRODUCT
        // ==========================================

        const product =
            products.find(
                item =>
                    item.slug === PRODUCT_SLUG
            );


        if (!product) {

            console.error(
                `Product with slug "${PRODUCT_SLUG}" was not found.`
            );

            return;
        }


        // ==========================================
        // 4. GET PRODUCT ITEMS
        // ==========================================

        const itemsResponse =
            await fetch(
                `${API_URL}/api/product-items/product/${product._id}`
            );


        if (!itemsResponse.ok) {

            throw new Error(
                "Failed to load product items"
            );

        }


        const items =
            await itemsResponse.json();


        // ==========================================
        // 5. FIND PACKAGE CONTAINER
        // ==========================================

        const container =
            document.querySelector(
                ".package-grid"
            );


        if (!container) {

            console.error(
                "Package container (.package-grid) was not found."
            );

            return;
        }


        // Clear old packages

        container.innerHTML = "";


        // ==========================================
        // 6. NO PACKAGES
        // ==========================================

        if (!items || !items.length) {

            container.innerHTML = `

                <div class="no-packages">

                    <h3>
                        No packages available
                    </h3>

                    <p>
                        Please check back later.
                    </p>

                </div>

            `;

            return;
        }


        // ==========================================
        // 7. CREATE PACKAGE CARDS
        // ==========================================

        items.forEach((item) => {


            // ======================================
            // FINAL PRICE
            // ======================================

            const finalPrice =

                item.discountPrice &&
                item.discountPrice > 0 &&
                item.discountPrice < item.price

                    ? item.discountPrice

                    : item.price;


            // ======================================
            // CREATE CARD
            // ======================================

            const card =
                document.createElement("div");


            card.className =
                "package-card";


            // ======================================
            // PACKAGE HTML
            // ======================================

            card.innerHTML = `

                ${
                    item.image
                        ? `

                            <img
                                src="${escapeHTML(item.image)}"
                                alt="${escapeHTML(item.title)}"
                                class="package-image"
                            >

                          `
                        : ""
                }


                <div class="package-info">


                    <h3>
                        ${escapeHTML(item.title)}
                    </h3>


                    ${
                        item.description
                            ? `

                                <p class="package-description">
                                    ${escapeHTML(item.description)}
                                </p>

                              `
                            : ""
                    }


                    <div class="package-price">


                        ${
                            item.discountPrice &&
                            item.discountPrice > 0 &&
                            item.discountPrice < item.price

                                ? `

                                    <span class="old-price">
                                        Rs. ${item.price}
                                    </span>

                                    <strong>
                                        Rs. ${finalPrice}
                                    </strong>

                                  `

                                : `

                                    <strong>
                                        Rs. ${finalPrice}
                                    </strong>

                                  `
                        }


                    </div>


                </div>

            `;


            // ==========================================
            // CLICK PACKAGE
            // ==========================================

            card.addEventListener(
                "click",
                function () {

                    selectPackage(
                        item,
                        card
                    );

                }
            );


            // ==========================================
            // ADD CARD
            // ==========================================

            container.appendChild(card);

        });


        // ==========================================
        // 8. AUTO SELECT FIRST PACKAGE
        // ==========================================

        const firstCard =
            container.querySelector(
                ".package-card"
            );


        if (firstCard && items.length > 0) {

        }


    } catch (error) {


        // ==========================================
        // ERROR
        // ==========================================

        console.error(
            "Product loading error:",
            error
        );


        const container =
            document.querySelector(
                ".package-grid"
            );


        if (container) {

            container.innerHTML = `

                <div class="no-packages">

                    <h3>
                        Unable to load packages
                    </h3>

                    <p>
                        Please refresh the page and try again.
                    </p>

                </div>

            `;

        }

    }

}


// ==========================================
// SELECT PACKAGE
// ==========================================

function selectPackage(
    item,
    selectedCard
) {


    // ==========================================
    // GET SUMMARY ELEMENTS
    // ==========================================

    const nameElement =
        document.getElementById(
            "packageName"
        );


    const priceElement =
        document.getElementById(
            "packagePrice"
        );


    const buyButton =
        document.getElementById(
            "buyButton"
        );


    // ==========================================
    // CALCULATE FINAL PRICE
    // ==========================================

    const finalPrice =

        item.discountPrice &&
        item.discountPrice > 0 &&
        item.discountPrice < item.price

            ? item.discountPrice

            : item.price;


    // ==========================================
    // REMOVE ACTIVE FROM ALL CARDS
    // ==========================================

    document
        .querySelectorAll(
            ".package-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "active"
                );

            }
        );


    // ==========================================
    // ACTIVATE SELECTED CARD
    // ==========================================

    if (selectedCard) {

        selectedCard.classList.add(
            "active"
        );

    }


    // ==========================================
    // UPDATE PACKAGE NAME
    // ==========================================

    if (nameElement) {

        nameElement.textContent =
            item.title;

    }


    // ==========================================
    // UPDATE PRICE
    // ==========================================

    if (priceElement) {

        priceElement.textContent =
            `Rs. ${finalPrice}`;

    }


    // ==========================================
    // SAVE SELECTED PACKAGE
    // ==========================================

    window.selectedProductItem =
        item;


    // ==========================================
    // UPDATE BUY BUTTON
    // ==========================================

    if (buyButton) {
        if (PRODUCT_SLUG === "ff" || PRODUCT_SLUG === "unipin") {
            const checkoutProduct = PRODUCT_SLUG === "unipin"
                ? "UniPin BD Voucher"
                : "Free Fire";
            const params = new URLSearchParams({
                product: checkoutProduct,
                package: item.title,
                price: `Rs. ${finalPrice}`,
                item: item._id
            });

            buyButton.href = `order.html?${params.toString()}`;
        } else {
            buyButton.href =
                `contact.html?product=${encodeURIComponent(
                    item.title
                )}&price=${finalPrice}`;
        }

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    loadProductItems
);
