const item =
    JSON.parse(localStorage.getItem("selectedProduct"));


// =========================================
// CHECK SELECTED PRODUCT
// =========================================

if (!item) {

    alert("No subscription selected.");

    window.location.href = "products.html";

    throw new Error("No subscription selected");

}


// =========================================
// ORDER SUMMARY
// =========================================

document.getElementById("checkoutProduct").textContent =
    "Product: " + item.product;

document.getElementById("checkoutPackage").textContent =
    "Plan: " + item.package;

document.getElementById("checkoutPrice").textContent =
    "Price: " + item.price;


// =========================================
// COMPRESS PAYMENT SCREENSHOT
// =========================================

async function compressImage(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = function(event) {

            const img = new Image();

            img.onload = function() {

                const canvas =
                    document.createElement("canvas");

                const maxWidth = 1200;

                let width = img.width;
                let height = img.height;


                if (width > maxWidth) {

                    height =
                        height * (maxWidth / width);

                    width = maxWidth;

                }


                canvas.width = width;
                canvas.height = height;


                const ctx =
                    canvas.getContext("2d");


                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );


                const compressed =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.75
                    );


                resolve(compressed);

            };


            img.onerror = reject;

            img.src = event.target.result;

        };


        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}


// =========================================
// SUBMIT ORDER
// =========================================

document
    .getElementById("checkoutForm")
    .addEventListener("submit", async function(e) {

        e.preventDefault();


        const submitButton =
            document.querySelector(
                "#checkoutForm .btn-primary"
            );


        // Prevent multiple clicks
        if (submitButton.disabled) {

            return;

        }


        // =========================================
        // CHECK SCREENSHOT FIRST
        // =========================================

        const screenshotFile =
            document
                .getElementById("screenshot")
                .files[0];


        if (!screenshotFile) {

            alert(
                "Please upload your payment screenshot."
            );

            return;

        }


        // =========================================
        // START LOADING
        // =========================================

        submitButton.disabled = true;

        let dots = 0;


        const loadingText =
            setInterval(() => {

                dots++;

                if (dots > 3) {

                    dots = 1;

                }


                submitButton.textContent =
                    "Placing your order" +
                    ".".repeat(dots);

            }, 400);


        try {

            // =========================================
            // COMPRESS SCREENSHOT
            // =========================================

            const screenshot =
                await compressImage(
                    screenshotFile
                );


            // =========================================
            // GET FORM VALUES
            // =========================================

            const order = {

                product:
                    item.product,

                package:
                    item.package,

                price:
                    item.price,

                email:
                    document
                        .getElementById("email")
                        .value,

                customerName:
                    document
                        .getElementById("customerName")
                        .value,

                phone:
                    document
                        .getElementById("phone")
                        .value,

                payment:
                    document
                        .getElementById("payment")
                        .value,

                transactionId:
                    document
                        .getElementById("transactionId")
                        .value,

                screenshot:
                    screenshot,

                note:
                    document
                        .getElementById("note")
                        ?.value || "",

                type:
                    "subscription"

            };


            // =========================================
            // SEND ORDER TO SERVER
            // =========================================

            const res =
                await fetch(
                    "https://kavro-api.onrender.com/api/orders",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(order)

                    }
                );


            const text = await res.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch (err) {
                console.error("Server returned:", text);

                throw new Error(
                    "SERVER RESPONSE: " + text.substring(0, 300)
                );
            }


            // =========================================
            // CHECK SERVER RESPONSE
            // =========================================

            if (!res.ok) {

                throw new Error(
                    data.message ||
                    "Order failed."
                );

            }


            // =========================================
            // SUCCESS
            // =========================================

            clearInterval(
                loadingText
            );


            submitButton.textContent =
                "Order Placed ✓";


            // Remove selected product
            localStorage.removeItem(
                "selectedProduct"
            );


            // Redirect after short delay
            setTimeout(() => {

                window.location.href =
                    "index.html";

            }, 800);


        }

        catch (err) {

            console.error(
                "Subscription order error:",
                err
            );


            // Stop loading animation
            clearInterval(
                loadingText
            );


            // Return button to normal
            submitButton.disabled = false;

            submitButton.textContent =
                "Place Order";


            // Show error
            alert(
                err.message ||
                "Failed to place order."
            );

        }

    });


// =========================================
// PAYMENT METHOD SWITCHER
// =========================================

const paymentSelect =
    document.getElementById("payment");

const esewaDetails =
    document.getElementById("esewaDetails");

const bankDetails =
    document.getElementById("bankDetails");


function updatePaymentDetails() {

    if (
        !paymentSelect ||
        !esewaDetails ||
        !bankDetails
    ) {

        return;

    }


    // Hide both
    esewaDetails.style.display =
        "none";

    bankDetails.style.display =
        "none";


    // Show selected payment
    if (
        paymentSelect.value ===
        "eSewa"
    ) {

        esewaDetails.style.display =
            "block";

    }

    else if (
        paymentSelect.value ===
        "Bank Transfer"
    ) {

        bankDetails.style.display =
            "block";

    }

}


// =========================================
// PAYMENT CHANGE
// =========================================

if (paymentSelect) {

    paymentSelect.addEventListener(
        "change",
        updatePaymentDetails
    );


    // Run when page loads
    updatePaymentDetails();

}