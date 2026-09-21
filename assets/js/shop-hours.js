/* Kavro public shop-hours gate
 * Nepal time: open Monday-Friday, 11:00 AM-11:40 PM.
 * Saturday and Sunday are intentionally left unchanged.
 */
(function () {
    "use strict";

    const TIME_ZONE = "Asia/Kathmandu";
    const OPEN_HOUR = 11;
    const CLOSE_HOUR = 23;
    const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

    const formatParts = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    function getNepalNow() {
        const values = {};
        formatParts.formatToParts(new Date()).forEach((part) => {
            if (part.type !== "literal") values[part.type] = Number(part.value);
        });

        // Intl can return 24 for midnight in some browsers.
        if (values.hour === 24) values.hour = 0;

        const dayStart = Date.UTC(values.year, values.month - 1, values.day);
        const weekday = new Date(dayStart).getUTCDay();
        const localMs = dayStart + (
            ((values.hour * 60 + values.minute) * 60 + values.second) * 1000
        );

        return {
            ...values,
            weekday,
            localMs,
            utcMs: localMs - NEPAL_OFFSET_MS
        };
    }

    function isWeekend(weekday) {
        return weekday === 0 || weekday === 6;
    }

    function nextWeekday(year, month, day, weekday) {
        let nextDay = new Date(Date.UTC(year, month - 1, day));
        do {
            nextDay = new Date(nextDay.getTime() + 86400000);
            weekday = nextDay.getUTCDay();
        } while (isWeekend(weekday));
        return nextDay;
    }

    function targetFor(nepalNow) {
        const beforeOpening = nepalNow.hour < OPEN_HOUR;
        const afterClosing =
            nepalNow.hour > CLOSE_HOUR ||
            (nepalNow.hour === CLOSE_HOUR && nepalNow.minute >= CLOSE_MINUTE);

        if (beforeOpening) {
            return Date.UTC(
                nepalNow.year,
                nepalNow.month - 1,
                nepalNow.day,
                OPEN_HOUR
            ) - NEPAL_OFFSET_MS;
        }

        if (afterClosing) {
            const next = nextWeekday(
                nepalNow.year,
                nepalNow.month,
                nepalNow.day,
                nepalNow.weekday
            );
            return Date.UTC(
                next.getUTCFullYear(),
                next.getUTCMonth(),
                next.getUTCDate(),
                OPEN_HOUR
            ) - NEPAL_OFFSET_MS;
        }

        return null;
    }

    function addStyles() {
        if (document.getElementById("kavro-shop-hours-styles")) return;

        const style = document.createElement("style");
        style.id = "kavro-shop-hours-styles";
        style.textContent = `
            body.kavro-shop-closed { overflow:hidden !important; }
            #kavroShopHoursGate {
                position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center;
                overflow:hidden; padding:20px; color:#f8fbff; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
                background:
                    radial-gradient(circle at 18% 18%, rgba(37,99,235,.32), transparent 30%),
                    radial-gradient(circle at 82% 78%, rgba(14,165,233,.22), transparent 32%),
                    linear-gradient(135deg,#030712 0%,#07152b 48%,#020617 100%);
            }
            #kavroShopHoursGate::before, #kavroShopHoursGate::after {
                content:""; position:absolute; border-radius:999px; pointer-events:none; filter:blur(2px);
                border:1px solid rgba(96,165,250,.28); transform:rotate(-20deg);
            }
            #kavroShopHoursGate::before { width:120vw; height:38vh; box-shadow:0 0 80px rgba(37,99,235,.16); animation:kavroGateSweep 10s ease-in-out infinite alternate; }
            #kavroShopHoursGate::after { width:90vw; height:30vh; border-color:rgba(34,211,238,.18); animation:kavroGateSweep 14s ease-in-out infinite alternate-reverse; }
            .kavro-gate-particles { position:absolute; inset:0; overflow:hidden; pointer-events:none; opacity:.7; }
            .kavro-gate-particles i { position:absolute; width:3px; height:3px; border-radius:50%; background:#67e8f9; box-shadow:0 0 12px #22d3ee; animation:kavroGateFloat linear infinite; }
            .kavro-gate-particles i:nth-child(1){left:8%;top:22%;animation-duration:7s}.kavro-gate-particles i:nth-child(2){left:20%;top:80%;animation-duration:9s}.kavro-gate-particles i:nth-child(3){left:38%;top:12%;animation-duration:8s}.kavro-gate-particles i:nth-child(4){left:65%;top:24%;animation-duration:11s}.kavro-gate-particles i:nth-child(5){left:78%;top:76%;animation-duration:8s}.kavro-gate-particles i:nth-child(6){left:92%;top:36%;animation-duration:10s}
            .kavro-gate-card { position:relative; z-index:1; width:min(520px,100%); padding:34px 28px 26px; text-align:center; border:1px solid rgba(147,197,253,.3); border-radius:28px; background:linear-gradient(145deg,rgba(15,31,58,.94),rgba(4,12,28,.9)); box-shadow:0 30px 100px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08); backdrop-filter:blur(18px); animation:kavroGateIn .65s cubic-bezier(.2,.8,.2,1); }
            .kavro-gate-logo { width:72px; height:72px; object-fit:contain; margin:0 auto 15px; filter:drop-shadow(0 0 18px rgba(59,130,246,.55)); animation:kavroGatePulse 2.6s ease-in-out infinite; }
            .kavro-gate-kicker { margin:0 0 8px; color:#67e8f9; font-size:11px; font-weight:800; letter-spacing:.22em; text-transform:uppercase; }
            .kavro-gate-title { margin:0; font-size:clamp(26px,6vw,42px); line-height:1.08; letter-spacing:-.04em; }
            .kavro-gate-copy { max-width:390px; margin:14px auto 20px; color:#bfdbfe; line-height:1.55; font-size:14px; }
            .kavro-gate-countdown { display:flex; justify-content:center; gap:9px; margin:18px 0 22px; }
            .kavro-gate-unit { min-width:74px; padding:12px 8px 10px; border:1px solid rgba(96,165,250,.25); border-radius:15px; background:rgba(15,45,85,.56); box-shadow:0 0 24px rgba(14,165,233,.09); }
            .kavro-gate-unit strong { display:block; color:#fff; font-size:27px; line-height:1; font-variant-numeric:tabular-nums; }
            .kavro-gate-unit span { display:block; margin-top:6px; color:#93c5fd; font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
            .kavro-gate-status { display:inline-flex; align-items:center; gap:8px; margin-bottom:16px; padding:7px 12px; border-radius:999px; background:rgba(30,64,175,.2); color:#bfdbfe; font-size:12px; }
            .kavro-gate-status b { width:7px; height:7px; border-radius:50%; background:#f59e0b; box-shadow:0 0 12px #f59e0b; animation:kavroGateBlink 1.4s ease-in-out infinite; }
            .kavro-gate-help { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 18px; border-radius:12px; color:#fff; text-decoration:none; font-weight:800; background:linear-gradient(135deg,#2563eb,#0891b2); box-shadow:0 10px 25px rgba(37,99,235,.24); transition:transform .2s ease,box-shadow .2s ease; }
            .kavro-gate-help:hover { transform:translateY(-2px); box-shadow:0 14px 30px rgba(37,99,235,.4); }
            .kavro-gate-footer { margin:19px 0 0; color:#64748b; font-size:11px; }
            @keyframes kavroGateIn { from { opacity:0; transform:translateY(22px) scale(.96); } to { opacity:1; transform:none; } }
            @keyframes kavroGatePulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.07); } }
            @keyframes kavroGateSweep { from { transform:rotate(-20deg) translateX(-8%); } to { transform:rotate(-20deg) translateX(8%); } }
            @keyframes kavroGateFloat { 0% { transform:translateY(20px); opacity:0; } 20%,80% { opacity:1; } 100% { transform:translateY(-110px); opacity:0; } }
            @keyframes kavroGateBlink { 0%,100% { opacity:.45; } 50% { opacity:1; } }
            @media (max-width:420px) { .kavro-gate-card { padding:28px 18px 22px; border-radius:22px; } .kavro-gate-countdown { gap:5px; } .kavro-gate-unit { min-width:65px; padding:11px 5px 9px; } .kavro-gate-unit strong { font-size:23px; } }
            @media (prefers-reduced-motion:reduce) { #kavroShopHoursGate *,#kavroShopHoursGate::before,#kavroShopHoursGate::after { animation:none !important; transition:none !important; } }
        `;
        document.head.appendChild(style);
    }

    function createGate(targetMs, afterClosing) {
        if (document.getElementById("kavroShopHoursGate")) return;
        addStyles();
        const gate = document.createElement("div");
        gate.id = "kavroShopHoursGate";
        gate.setAttribute("role", "dialog");
        gate.setAttribute("aria-modal", "true");
        gate.setAttribute("aria-labelledby", "kavroGateTitle");
        gate.innerHTML = `
            <div class="kavro-gate-particles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <section class="kavro-gate-card">
                <img class="kavro-gate-logo" src="/assets/images/logo.png" alt="Kavro Nepal">
                <p class="kavro-gate-kicker">Kavro Nepal · Official Store</p>
                <h1 class="kavro-gate-title" id="kavroGateTitle">We WIll be open soon</h1>
                <p class="kavro-gate-copy" id="kavroGateCopy">Our shop opens at <strong>11:00 AM Nepal time</strong>. Your order window is reserved please stay on this page.</p>
                <div class="kavro-gate-status"><b></b><span id="kavroGateStatus">Please wait for shop opens</span></div>
                <div class="kavro-gate-countdown" aria-live="polite" aria-label="Time until Kavro opens">
                    <div class="kavro-gate-unit"><strong id="kavroGateHours">00</strong><span>Hours</span></div>
                    <div class="kavro-gate-unit"><strong id="kavroGateMinutes">00</strong><span>Minutes</span></div>
                    <div class="kavro-gate-unit"><strong id="kavroGateSeconds">00</strong><span>Seconds</span></div>
                </div>
                <a class="kavro-gate-help" href="https://www.facebook.com/profile.php?id=61574738600137" target="_blank" rel="noopener">Contact Kavro Nepal For Argent Topups</a>
                <p class="kavro-gate-footer">SHOP OPEN FROM 11 AM TO 11 PM</p>
            </section>
        `;
        document.body.appendChild(gate);
        document.body.classList.add("kavro-shop-closed");

        if (afterClosing) {
            gate.querySelector("#kavroGateTitle").textContent = "Kavro is closed for today";
            gate.querySelector("#kavroGateCopy").innerHTML = "Weâ€™ve safely closed todayâ€™s order window. Weâ€™ll reopen on the next working day at <strong>11:00 AM Nepal time</strong>.";
            gate.querySelector("#kavroGateStatus").textContent = "Next opening time is being counted down";
        }

        function tick() {
            const remaining = Math.max(0, targetMs - Date.now());
            const totalSeconds = Math.ceil(remaining / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            gate.querySelector("#kavroGateHours").textContent = String(hours).padStart(2, "0");
            gate.querySelector("#kavroGateMinutes").textContent = String(minutes).padStart(2, "0");
            gate.querySelector("#kavroGateSeconds").textContent = String(seconds).padStart(2, "0");
        }

        tick();
        window.setInterval(tick, 1000);
    }

    function init() {
        const now = getNepalNow();
        if (isWeekend(now.weekday)) return;

        const openNow =
            (now.hour > OPEN_HOUR || (now.hour === OPEN_HOUR && now.minute >= 0)) &&
            (now.hour < CLOSE_HOUR || (now.hour === CLOSE_HOUR && now.minute < CLOSE_MINUTE));

        if (openNow) return;
        const targetMs = targetFor(now);
        if (targetMs) createGate(targetMs, now.hour >= CLOSE_HOUR && now.minute >= CLOSE_MINUTE);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();