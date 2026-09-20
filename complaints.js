// ---------------------------------------------------------------
// Fetches this citizen's own complaints from the same Apps Script
// backend worker.html reads/writes, via api.js's MycApi client.
// Status here always mirrors whatever an authority set in worker.html:
//   PENDING -> ACCEPTED or REJECTED -> COMPLETED
// ---------------------------------------------------------------

let complaints = [];

const STATUS_LABELS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COMPLETED: "Completed"
};

// Badge/step colour class per status (see complaints.css)
const STATUS_CLASS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COMPLETED: "completed"
};

// Normal (non-rejected) progression, used to draw the step tracker
const STEP_ORDER = ["PENDING", "ACCEPTED", "COMPLETED"];

let activeFilter = "all";

const listEl = document.getElementById("complaintList");
const emptyEl = document.getElementById("emptyMessage");
const filterButtons = document.querySelectorAll(".filter-btn");

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function buildProgressSteps(status) {
  // Rejected breaks the normal Pending -> Accepted -> Completed line,
  // so it gets its own message instead of a step tracker.
  if (status === "REJECTED") {
    return `<div class="rejected-note">This complaint was reviewed and rejected by the authority.</div>`;
  }

  const currentIndex = STEP_ORDER.indexOf(status);
  return `<div class="progress-steps">` + STEP_ORDER.map((stepKey, i) => {
    let stateClass = "";
    if (i < currentIndex) stateClass = "done";
    else if (i === currentIndex) stateClass = "current";
    return `
      <div class="step ${stateClass}">
        <div class="dot"></div>
        ${STATUS_LABELS[stepKey]}
      </div>
    `;
  }).join("") + `</div>`;
}

function mapSheetComplaint(row) {
  return {
    id: row.id,
    title: row.category + (row.locality ? " — " + row.locality : ""),
    description: row.description,
    dateFiled: row.timestamp,
    status: row.status,
    locality: row.locality,
    address: row.address,
    photos: row.photos || []
  };
}

function renderComplaints() {
  const filtered = activeFilter === "all"
    ? complaints
    : complaints.filter(c => c.status === activeFilter);

  listEl.innerHTML = "";

  if (filtered.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  filtered.forEach(complaint => {
    const label = STATUS_LABELS[complaint.status] || complaint.status;
    const cls = STATUS_CLASS[complaint.status] || "pending";

    const card = document.createElement("div");
    card.className = "complaint-card";
    card.innerHTML = `
      <div class="card-top">
        <div>
          <p class="complaint-title">${complaint.title}</p>
          <span class="complaint-id">${complaint.id}</span>
        </div>
        <span class="status-badge ${cls}">${label}</span>
      </div>
      <div class="complaint-date">Filed on ${formatDate(complaint.dateFiled)}</div>
      ${complaint.photos.length ? `<div class="complaint-photo-count">📷 ${complaint.photos.length} photo${complaint.photos.length > 1 ? "s" : ""} attached</div>` : ""}
      <div class="progress-track">
        ${buildProgressSteps(complaint.status)}
      </div>
    `;

    // Clicking a card expands/collapses its progress tracker
    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });

    listEl.appendChild(card);
  });
}

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.getAttribute("data-filter");
    renderComplaints();
  });
});

function loadComplaints() {
  if (typeof MycApi === "undefined" || !MycApi.isConfigured()) {
    listEl.innerHTML = "";
    emptyEl.hidden = false;
    emptyEl.textContent = "The complaint backend isn't connected yet — set MYC_API_URL in api.js.";
    return;
  }

  listEl.innerHTML = `<p class="empty-message">Loading your complaints…</p>`;

  MycApi.listMyComplaints()
    .then(result => {
      if (!result || result.error) {
        complaints = [];
        listEl.innerHTML = "";
        emptyEl.hidden = false;
        emptyEl.textContent = "Couldn't load your complaints right now. Please try again later.";
        return;
      }
      complaints = (result.complaints || []).map(mapSheetComplaint);
      emptyEl.textContent = "No complaints match this filter.";
      renderComplaints();
    })
    .catch(() => {
      complaints = [];
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = "Couldn't load your complaints right now. Please try again later.";
    });
}

loadComplaints();