const CONFIG = {
  brandEmail: "136738596@qq.com",
  checkoutLinks: {
    pilot: "",
    retainer: "",
    dedicated: "",
  },
};

const PLANS = {
  pilot: { label: "Pilot", price: "$199" },
  retainer: { label: "Retainer", price: "$799/month" },
  dedicated: { label: "Dedicated", price: "$1,999/month" },
};

const platformStatus = document.querySelector("#platformStatus");
const checkoutMessage = document.querySelector("#checkoutMessage");
const contactLink = document.querySelector("#contactLink");
const buyButtons = [...document.querySelectorAll("[data-plan]")];

function refreshLemonButtons() {
  let configuredCount = 0;
  buyButtons.forEach((button) => {
    const planKey = button.dataset.plan;
    const checkoutUrl = CONFIG.checkoutLinks[planKey];
    if (checkoutUrl) {
      button.href = checkoutUrl;
      button.target = "_blank";
      button.rel = "noreferrer";
      configuredCount += 1;
      return;
    }
    button.href = "#pricing";
  });

  if (configuredCount === Object.keys(CONFIG.checkoutLinks).length) {
    platformStatus.textContent = "Checkout is live and ready to collect payments.";
    checkoutMessage.textContent = "Lemon Squeezy links are configured. Customers can pay directly from this page.";
  } else {
    platformStatus.textContent = "Lemon Squeezy is selected. Add your three hosted checkout URLs in nodepilot.js to go live.";
    checkoutMessage.innerHTML = "Recommended setup: create 3 products in Lemon Squeezy, copy each hosted checkout URL, and paste them into <code>CONFIG.checkoutLinks</code>. Until then, the page works as a public sales entry and contact funnel.";
  }
}

function wireContactFallback() {
  const subject = encodeURIComponent("NodePilot Ops Inquiry");
  contactLink.href = `mailto:${CONFIG.brandEmail}?subject=${subject}`;
}

function attachButtonHandlers() {
  buyButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const planKey = button.dataset.plan;
      const checkoutUrl = CONFIG.checkoutLinks[planKey];
      const plan = PLANS[planKey];
      if (checkoutUrl) {
        return;
      }
      event.preventDefault();
      checkoutMessage.innerHTML = `${plan.label} ${plan.price} is ready as an offer, but the checkout URL is still empty. Add the Lemon Squeezy hosted checkout link for <code>${planKey}</code> in <code>nodepilot.js</code> to start charging publicly.`;
      document.querySelector("#pricing").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initLemonOverlay() {
  if (typeof window.createLemonSqueezy === "function") {
    window.createLemonSqueezy();
  }
}

wireContactFallback();
refreshLemonButtons();
attachButtonHandlers();
window.addEventListener("load", initLemonOverlay);
