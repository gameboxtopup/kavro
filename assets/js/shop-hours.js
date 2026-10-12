// /* Kavro shop-hours gate
//  * Monday-Friday: maintenance until 7:00 PM Nepal time.
//  * Shop opens 7:00 PM and closes 11:40 PM.
//  * Saturday and Sunday remain unchanged.
//  */

// (function () {
//     "use strict";

//     const TIME_ZONE = "Asia/Kathmandu";
//     const OPEN_HOUR = 19; // 7:00 PM
//     const CLOSE_HOUR = 23; // 11:40 PM
//     const CLOSE_MINUTE = 40;
//     const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

//     const formatter = new Intl.DateTimeFormat("en-US", {
//         timeZone: TIME_ZONE,
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit",
//         hour12: false
//     });

//     function getNepalTime() {
//         const values = {};

//         formatter.formatToParts(new Date()).forEach((part) => {
//             if (part.type !== "literal") {
//                 values[part.type] = Number(part.value);
//             }
//         });

//         if (values.hour === 24) values.hour = 0;

//         const dateStart = Date.UTC(
//             values.year,
//             values.month - 1,
//             values.day
//         );

//         return {
//             ...values,
//             weekday: new Date(dateStart).getUTCDay()
//         };
//     }

//     function isWeekend(day) {
//         return day === 0 || day === 6;
//     }

//     function getNextWeekday(year, month, day) {
//         let next = new Date(Date.UTC(year, month - 1, day));

//         do {
//             next = new Date(next.getTime() + 86400000);
//         } while (isWeekend(next.getUTCDay()));

//         return next;
//     }

//     function getOpeningTime(now) {
//         const beforeOpening = now.hour < OPEN_HOUR;

//         const afterClosing =
//             now.hour > CLOSE_HOUR ||
//             (now.hour === CLOSE_HOUR &&
//                 now.minute >= CLOSE_MINUTE);

//         if (beforeOpening) {
//             return Date.UTC(
//                 now.year,
//                 now.month - 1,
//                 now.day,
//                 OPEN_HOUR
//             ) - NEPAL_OFFSET_MS;
//         }

//         if (afterClosing) {
//             const next = getNextWeekday(
//                 now.year,
//                 now.month,
//                 now.day
//             );

//             return Date.UTC(
//                 next.getUTCFullYear(),
//                 next.getUTCMonth(),
//                 next.getUTCDate(),
//                 OPEN_HOUR
//             ) - NEPAL_OFFSET_MS;
//         }

//         return null;
//     }

//     function addStyles() {
//         const style = document.createElement("style");

//         style.textContent = `
//             body.kavro-shop-closed {
//                 overflow: hidden !important;
//             }

//             #kavroShopHoursGate {
//                 position: fixed;
//                 inset: 0;
//                 z-index: 2147483000;
//                 display: grid;
//                 place-items: center;
//                 padding: 20px;
//                 color: white;
//                 font-family: Arial, sans-serif;
//                 background:
//                     radial-gradient(circle at top left, #2563eb55, transparent 35%),
//                     radial-gradient(circle at bottom right, #06b6d455, transparent 35%),
//                     linear-gradient(135deg, #020617, #071a38, #020617);
//             }

//             .kavro-gate-card {
//                 width: min(500px, 100%);
//                 padding: 35px 25px;
//                 text-align: center;
//                 border: 1px solid #60a5fa66;
//                 border-radius: 25px;
//                 background: #07152bee;
//                 box-shadow: 0 25px 80px #0009;
//                 animation: kavroGateIn .7s ease;
//             }

//             .kavro-gate-logo {
//                 width: 75px;
//                 height: 75px;
//                 object-fit: contain;
//                 margin-bottom: 15px;
//                 animation: kavroGatePulse 2s infinite;
//             }

//             .kavro-gate-label {
//                 color: #67e8f9;
//                 font-size: 12px;
//                 font-weight: bold;
//                 letter-spacing: 2px;
//                 text-transform: uppercase;
//             }

//             .kavro-gate-title {
//                 margin: 12px 0;
//                 font-size: clamp(28px, 7vw, 44px);
//             }

//             .kavro-gate-text {
//                 color: #bfdbfe;
//                 line-height: 1.6;
//                 font-size: 15px;
//             }

//             .kavro-countdown {
//                 display: flex;
//                 justify-content: center;
//                 gap: 8px;
//                 margin: 25px 0;
//             }

//             .kavro-time-box {
//                 min-width: 75px;
//                 padding: 13px 8px;
//                 border-radius: 14px;
//                 background: #0f2d55;
//                 border: 1px solid #60a5fa55;
//             }

//             .kavro-time-box strong {
//                 display: block;
//                 font-size: 27px;
//             }

//             .kavro-time-box span {
//                 color: #93c5fd;
//                 font-size: 10px;
//                 text-transform: uppercase;
//             }

//             .kavro-contact {
//                 display: inline-block;
//                 padding: 13px 20px;
//                 border-radius: 12px;
//                 color: white;
//                 text-decoration: none;
//                 font-weight: bold;
//                 background: linear-gradient(135deg, #2563eb, #0891b2);
//             }

//             .kavro-footer {
//                 margin-top: 20px;
//                 color: #94a3b8;
//                 font-size: 11px;
//             }

//             @keyframes kavroGateIn {
//                 from {
//                     opacity: 0;
//                     transform: translateY(25px) scale(.95);
//                 }
//                 to {
//                     opacity: 1;
//                     transform: none;
//                 }
//             }

//             @keyframes kavroGatePulse {
//                 0%, 100% {
//                     transform: scale(1);
//                 }
//                 50% {
//                     transform: scale(1.08);
//                 }
//             }

//             @media (max-width: 420px) {
//                 .kavro-time-box {
//                     min-width: 62px;
//                 }

//                 .kavro-time-box strong {
//                     font-size: 23px;
//                 }
//             }
//         `;

//         document.head.appendChild(style);
//     }

//     function createGate(targetTime, afterClosing) {
//         if (document.getElementById("kavroShopHoursGate")) return;

//         addStyles();

//         const gate = document.createElement("div");
//         gate.id = "kavroShopHoursGate";

//         gate.innerHTML = `
//             <section class="kavro-gate-card">
//                 <img
//                     class="kavro-gate-logo"
//                     src="/assets/images/logo.png"
//                     alt="Kavro Nepal"
//                 >

//                 <div class="kavro-gate-label">
//                     Kavro Nepal Maintenance
//                 </div>

//                 <h1 class="kavro-gate-title">
//                     ${afterClosing ? "Shop closed for today" : "Come back at 7:00 PM"}
//                 </h1>

//                 <p class="kavro-gate-text">
//                     ${afterClosing
//                         ? "The shop will reopen on the next working day at 7:00 PM Nepal time."
//                         : "We are doing a quick maintenance update. The shop will reopen at 7:00 PM Nepal time."
//                     }
//                 </p>

//                 <div class="kavro-countdown">
//                     <div class="kavro-time-box">
//                         <strong id="kavroHours">00</strong>
//                         <span>Hours</span>
//                     </div>

//                     <div class="kavro-time-box">
//                         <strong id="kavroMinutes">00</strong>
//                         <span>Minutes</span>
//                     </div>

//                     <div class="kavro-time-box">
//                         <strong id="kavroSeconds">00</strong>
//                         <span>Seconds</span>
//                     </div>
//                 </div>

//                 <a
//                     class="kavro-contact"
//                     href="https://www.facebook.com/profile.php?id=61574738600137"
//                     target="_blank"
//                     rel="noopener"
//                 >
//                     Contact Kavro Nepal
//                 </a>

//                 <div class="kavro-footer">
//                     Open Monday-Friday: 7:00 PM-11:40 PM
//                 </div>
//             </section>
//         `;

//         document.body.appendChild(gate);
//         document.body.classList.add("kavro-shop-closed");

//         function updateCountdown() {
//             const secondsLeft = Math.max(
//                 0,
//                 Math.ceil((targetTime - Date.now()) / 1000)
//             );

//             document.getElementById("kavroHours").textContent =
//                 String(Math.floor(secondsLeft / 3600)).padStart(2, "0");

//             document.getElementById("kavroMinutes").textContent =
//                 String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");

//             document.getElementById("kavroSeconds").textContent =
//                 String(secondsLeft % 60).padStart(2, "0");
//         }

//         updateCountdown();
//         setInterval(updateCountdown, 1000);
//     }

//     function initShopHours() {
//         const now = getNepalTime();

//         if (isWeekend(now.weekday)) return;

//         const shopIsOpen =
//             (now.hour > OPEN_HOUR ||
//                 (now.hour === OPEN_HOUR && now.minute >= 0)) &&
//             (now.hour < CLOSE_HOUR ||
//                 (now.hour === CLOSE_HOUR && now.minute < CLOSE_MINUTE));

//         if (shopIsOpen) return;

//         const targetTime = getOpeningTime(now);

//         if (!targetTime) return;

//         const afterClosing =
//             now.hour > CLOSE_HOUR ||
//             (now.hour === CLOSE_HOUR &&
//                 now.minute >= CLOSE_MINUTE);

//         createGate(targetTime, afterClosing);
//     }

//     if (document.readyState === "loading") {
//         document.addEventListener(
//             "DOMContentLoaded",
//             initShopHours,
//             { once: true }
//         );
//     } else {
//         initShopHours();
//     }
// })();