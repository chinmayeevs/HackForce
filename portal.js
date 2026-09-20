// ---------------------------------------------------------------
// Demo authority login for Mysuru Civic Connect.
// This is intentionally client-side/demo-only (hardcoded credentials) —
// for a real deployment, replace the check in handleAuthoritySubmit()
// with a real authentication call to your backend.
//
// This ward list must stay in sync with WARDS in worker.html and
// LOCALITY_TO_WARD in the Apps Script backend.
// ---------------------------------------------------------------

const DEMO_USERNAME = "authority";
const DEMO_PASSWORD = "mysuru2026";

const WARDS = [
  { id: 1, name: 'Rajiv Nagar / Udayagiri / Srirampura' },
  { id: 2, name: 'Devaraja Mohalla / Vontikoppal' },
  { id: 3, name: 'Kuvempunagar' },
  { id: 4, name: 'Vijayanagar / Bogadi / Dattagalli' },
  { id: 5, name: 'Hebbal / Hootagalli' },
  { id: 6, name: 'Saraswathipuram / Jayalakshmipuram' },
  { id: 7, name: 'Lakshmipuram' },
  { id: 8, name: 'Gokulam / Metagalli / Yadavgiri' },
  { id: 9, name: 'JP Nagar / Bannimantap' },
  { id: 10, name: 'Vidyaranyapuram / Ramakrishnanagar / Alanahalli / Kadakola' },
  { id: 0, name: 'Other Mysuru Area' },
];

document.addEventListener("DOMContentLoaded", function () {
  var wardSelect = document.getElementById("authWard");
  WARDS.forEach(function (w) {
    var opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = w.name + " (Ward " + w.id + ")";
    wardSelect.appendChild(opt);
  });

  var form = document.getElementById("authorityForm");
  var errorEl = document.getElementById("authError");

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = "block";
  }

  function hideError() {
    errorEl.style.display = "none";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();

    var username = document.getElementById("authUsername").value.trim();
    var password = document.getElementById("authPassword").value;
    var wardId = document.getElementById("authWard").value;

    if (!wardId) {
      showError("Please select your ward.");
      return;
    }

    if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      showError("Invalid username or password.");
      return;
    }

    var ward = WARDS.find(function (w) { return String(w.id) === String(wardId); });

    // Handed off to worker.html via sessionStorage (cleared when the
    // browser tab closes) — worker.html reads this on load to gate
    // access and pre-filter the inbox to this ward.
    sessionStorage.setItem("mcc_worker_authed", "true");
    sessionStorage.setItem("mcc_worker_ward_id", String(wardId));
    sessionStorage.setItem("mcc_worker_ward_name", ward ? ward.name : "");

    window.location.href = "worker.html";
  });
});