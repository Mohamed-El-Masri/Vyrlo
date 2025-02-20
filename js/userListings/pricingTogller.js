let isAnnual = false;
function togglePricing() {
    isAnnual = !isAnnual;
    document.getElementById('listing-price').innerHTML = isAnnual ? "$39<span>/year</span>" : "$19<span>/month</span>";
    document.getElementById('boosting-price').innerHTML = isAnnual ? "$49<span>/year</span>" : "$19<span>/month</span>";
    document.getElementById('listing-projects').innerText = isAnnual ? "Unlimited" : "5";
    document.getElementById('boosting-projects').innerText = isAnnual ? "Unlimited" : "5";
    document.querySelector('button.toggle-btn').innerText = isAnnual ? "Switch to Monthly" : "Switch to Annual";
}