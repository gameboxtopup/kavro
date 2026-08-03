// Load selected subscription

const item = JSON.parse(localStorage.getItem("selectedProduct"));

if (!item) {

    alert("No subscription selected.");

    window.location.href = "products.html";

}

// Show Order Summary

document.getElementById("checkoutProduct").textContent =
    "Product: " + item.product;

document.getElementById("checkoutPackage").textContent =
    "Plan: " + item.package;

document.getElementById("checkoutPrice").textContent =
    "Price: " + item.price;


// Submit Order

document.getElementById("checkoutForm").addEventListener("submit", async function(e){

    e.preventDefault();

    const order = {

        product: item.product,

        package: item.package,

        price: item.price,

        email: document.getElementById("email").value,

        customerName: document.getElementById("customerName").value,

        phone: document.getElementById("phone").value,

        payment: document.getElementById("payment").value,

        type: "subscription"

    };

    try {

        const res = await fetch("https://kavro-api.onrender.com/api/orders", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(order)

        });

        const data = await res.json();

        alert(data.message || "Subscription order placed successfully!");

        localStorage.removeItem("selectedProduct");

        window.location.href = "index.html";

    }

    catch(err){

        console.error(err);

        alert("Failed to place order.");

    }

});