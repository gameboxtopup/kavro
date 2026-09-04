const item = JSON.parse(localStorage.getItem("selectedProduct"));

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
// COMPRESS SCREENSHOT
// =========================================

async function compressImage(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = function (event) {

            const img = new Image();

            img.onload = function () {

                const canvas = document.createElement("canvas");

                const maxWidth = 1200;

                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {

                    height = height * (maxWidth / width);
                    width = maxWidth;

                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );

                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        0.7
                    )
                );

            };

            img.onerror = function () {
                reject(new Error("Could not read screenshot."));
            };

            img.src = event.target.result;

        };

        reader.onerror = function () {
            reject(new Error("Could not read screenshot."));
        };

        reader.readAsDataURL(file);

    });

}


// =========================================
// SUBMIT ORDER
// =========================================

document
    .getElementById("checkoutForm")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const submitButton =
            document.querySelector("#checkoutForm .btn-primary");

        const errorBox =
            document.getElementById("orderError");

        if (errorBox) {
            errorBox.style.display = "none";
            errorBox.textContent = "";
        }


        if (submitButton.disabled) {
            return;
        }


        // =========================================
        // SCREENSHOT
        // =========================================

        const screenshotInput =
            document.getElementById("screenshot");

        const screenshotFile =
            screenshotInput.files[0];


        if (!screenshotFile) {

            if (errorBox) {
                errorBox.textContent =
                    "Please upload your payment screenshot.";
                errorBox.style.display = "block";
            }

            return;

        }


        // =========================================
        // START LOADING
        // =========================================

        submitButton.disabled = true;

        submitButton.textContent = "Placing your order...";


        try {

            // =========================================
            // COMPRESS IMAGE
            // =========================================

            submitButton.textContent =
                "Preparing your order...";

            const screenshot =
                await compressImage(screenshotFile);


            // =========================================
            // GET VALUES
            // =========================================

            const transactionId =
                document
                    .getElementById("transactionId")
                    .value
                    .trim();


            if (!transactionId) {

                throw new Error(
                    "Please enter your transaction ID."
                );

            }


            const order = {

                product: item.product,

                package: item.package,

                price: item.price,

                email:
                    document
                        .getElementById("email")
                        .value
                        .trim(),

                customerName:
                    document
                        .getElementById("customerName")
                        .value
                        .trim(),

                phone:
                    document
                        .getElementById("phone")
                        .value
                        .trim(),

                payment:
                    document
                        .getElementById("payment")
                        .value,

                transactionId:
                    transactionId,

                screenshot:
                    screenshot,

                note:
                    document
                        .getElementById("note")
                        ?.value
                        .trim() || "",

                type:
                    "subscription"

            };


            // =========================================
            // SEND TO SERVER
            // =========================================

            submitButton.textContent =
                "Placing your order...";


            const controller =
                new AbortController();


            // Stop waiting after 30 seconds
            const timeout =
                setTimeout(() => {

                    controller.abort();

                }, 30000);


            let response;

            try {

                response = await fetch(
                    "https://kavro-api.onrender.com/api/orders",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body:
                            JSON.stringify(order),

                        signal:
                            controller.signal

                    }
                );

            }

            catch (error) {

                clearTimeout(timeout);

                if (error.name === "AbortError") {

                    throw new Error(
                        "Server took too long to respond. Please try again."
                    );

                }

                throw new Error(
                    "Could not connect to the server."
                );

            }


            clearTimeout(timeout);


            // =========================================
            // READ RESPONSE
            // =========================================

            const responseText =
                await response.text();


            console.log(
                "Server response:",
                responseText
            );


            let data;

            try {

                data =
                    JSON.parse(responseText);

            }

            catch (error) {

                throw new Error(
                    "Server returned an invalid response."
                );

            }


            // =========================================
            // SERVER ERROR
            // =========================================

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Order could not be placed."
                );

            }


            if (data.success === false) {

                throw new Error(
                    data.message ||
                    "Order could not be placed."
                );

            }


            // =========================================
            // SUCCESS
            // =========================================

            submitButton.textContent =
                "Order Placed ✓";

            localStorage.removeItem(
                "selectedProduct"
            );


            // Show success message
            const checkoutCard =
                document.querySelector(".checkout-card");

            checkoutCard.innerHTML = `

                <div class="order-success">

                    <div class="success-icon">
                        ✓
                    </div>

                    <h2>
                        Order Placed Successfully!
                    </h2>

                    <p class="success-message">
                        Thank you for your order. We have received
                        your payment details and will review your order shortly.
                    </p>

                    <div class="success-summary">

                        <h3>
                            Order Summary
                        </h3>

                        <p>
                            <strong>Product:</strong>
                            ${item.product}
                        </p>

                        <p>
                            <strong>Plan:</strong>
                            ${item.package}
                        </p>

                        <p>
                            <strong>Price:</strong>
                            ${item.price}
                        </p>

                        <p>
                            <strong>Payment:</strong>
                            ${order.payment}
                        </p>

                        <p>
                            <strong>Transaction ID:</strong>
                            ${order.transactionId}
                        </p>

                        <div class="order-status">
                            🕐 Order Status: <strong>Pending Review</strong>
                        </div>

                    </div>

                    <p class="redirect-message">
                        Redirecting you to the home page in
                        <strong>5 seconds...</strong>
                    </p>

                </div>

            `;


            // Redirect after 5 seconds
            setTimeout(() => {

                window.location.href =
                    "index.html";

            }, 5000);


        }

        catch (error) {

            console.error(
                "Subscription order error:",
                error
            );


            submitButton.disabled = false;

            submitButton.textContent =
                "Place Order";


            if (errorBox) {

                errorBox.textContent =
                    error.message ||
                    "Failed to place order.";

                errorBox.style.display = "block";

            }

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


    esewaDetails.style.display = "none";

    bankDetails.style.display = "none";


    if (
        paymentSelect.value === "eSewa"
    ) {

        esewaDetails.style.display = "block";

    }


    else if (
        paymentSelect.value === "Bank Transfer"
    ) {

        bankDetails.style.display = "block";

    }

}


if (paymentSelect) {

    paymentSelect.addEventListener(
        "change",
        updatePaymentDetails
    );

    updatePaymentDetails();

}