(function () {
    const inviteLink = "https://chat.whatsapp.com/FX98OQ3V80q0lT1hjHGxJb";
    const storageKey = "kavroCommunityPopupDismissed";

    if (localStorage.getItem(storageKey) === "1") return;

    const show = () => {
        const backdrop = document.createElement("div");
        backdrop.className = "community-popup-backdrop";
        backdrop.innerHTML = `
            <section class="community-popup" role="dialog" aria-modal="true" aria-labelledby="communityPopupTitle">
                <button class="community-popup-close" type="button" aria-label="Close">×</button>
                <div class="community-popup-icon">📣</div>
                <h2 id="communityPopupTitle">Join Our WhatsApp Community</h2>
                <p>Stay updated with Kavro offers, new products, discounts and gaming news.</p>
                <a class="community-popup-join" href="${inviteLink}" target="_blank" rel="noopener">Join Now 🚀</a>
                <button class="community-popup-later" type="button">Maybe later</button>
                <label class="community-popup-never"><input type="checkbox" id="communityPopupNever"> Don't show again</label>
            </section>`;

        const close = () => {
            if (backdrop.querySelector("#communityPopupNever").checked) {
                localStorage.setItem(storageKey, "1");
            }
            backdrop.remove();
        };
        backdrop.addEventListener("click", (event) => {
            if (event.target === backdrop) close();
        });
        backdrop.querySelector(".community-popup-close").addEventListener("click", close);
        backdrop.querySelector(".community-popup-later").addEventListener("click", close);
        document.body.appendChild(backdrop);
    };

    window.setTimeout(show, 1800);
})();
