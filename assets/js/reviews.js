const reviewsGrid = document.getElementById("reviewsGrid");
const reviewSummary = document.getElementById("reviewSummary");

function reviewStars(rating) {
    return "★".repeat(Math.max(1, Math.min(5, Number(rating) || 0))) + "☆".repeat(5 - Math.max(1, Math.min(5, Number(rating) || 0)));
}

function reviewSafe(value) {
    return String(value || "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

async function loadReviews() {
    if (!reviewsGrid) return;
    const response = await fetch("https://kavro-api.onrender.com/api/reviews");
    if (!response.ok) throw new Error("Reviews unavailable");
    const data = await response.json();
    const reviews = data.reviews || [];
    const summary = data.summary || {};

    if (reviewSummary && summary.count) {
        reviewSummary.textContent = `${Number(summary.average).toFixed(1)} / 5 · ${summary.count} verified review${summary.count === 1 ? "" : "s"}`;
    }
    if (!reviews.length) {
        reviewsGrid.innerHTML = `<div class="testimonial-card review-loading">Be the first customer to review a completed order.</div>`;
        return;
    }
    reviewsGrid.innerHTML = reviews.slice(0, 6).map(review => `
        <article class="testimonial-card">
            <p class="review-stars">${reviewStars(review.rating)}</p>
            <p>“${reviewSafe(review.comment)}”</p>
            <h4>— ${reviewSafe(review.customerName)} · ${reviewSafe(review.product)}</h4>
            <small class="verified-review">✓ Verified purchase</small>
        </article>
    `).join("");
}

loadReviews().catch(() => {
    if (reviewsGrid) reviewsGrid.innerHTML = `<div class="testimonial-card review-loading">Customer reviews are temporarily unavailable.</div>`;
});
