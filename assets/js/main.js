// assets/js/main.js
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Stored categories are in French; display them in English
const CAT = { "Analyse d'entreprise": "Company analysis", "Concept financier": "Financial concept", "Rapport annuel": "Annual report", "Transaction M&A": "M&A transaction" };

const fmtDate = (d) => {
  if (!d) return "";
  const date = d.toDate ? d.toDate() : new Date(d);
  if (isNaN(date)) return "";
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

function cardHTML(w, inTravaux) {
  const href = (inTravaux ? "" : "travaux/") + "article.html?id=" + encodeURIComponent(w.id);
  return `
    <a class="card" href="${href}" data-cat="${esc(w.category)}">
      <div class="meta"><b>${esc(CAT[w.category] || w.category)}</b><span>${esc(fmtDate(w.date))}</span></div>
      <h3>${esc(w.title)}</h3>
      <p>${esc(w.excerpt)}</p>
      <span class="more">Read the article →</span>
    </a>`;
}

// No publication: hide the section on the home page, show a message on the Work page
function showEmpty() {
  const sec = document.getElementById("latest-section");
  if (sec) sec.style.display = "none";
  const empty = document.getElementById("empty");
  if (empty && document.getElementById("works")) {
    empty.textContent = "First publications coming soon.";
    empty.style.display = "block";
  }
}

async function loadWorks() {
  const latest = document.getElementById("latest");
  const works = document.getElementById("works");
  const target = works || latest;
  if (!target) return; // page without a list: nothing to load

  try {
    const { db } = await import("./firebase-config.js");
    const { collection, query, where, getDocs } =
      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    // No server-side orderBy: avoids creating a composite index
    const snap = await getDocs(query(collection(db, "travaux"), where("published", "==", true)));
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!items.length) return showEmpty();

    items.sort((a, b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
      const dbb = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
      return dbb - da;
    });

    if (!works) items = items.slice(0, 3); // home page: latest 3
    target.innerHTML = items.map(w => cardHTML(w, !!works)).join("");
  } catch (err) {
    console.warn("Could not load works:", err);
    showEmpty();
  }
}

loadWorks();

// ============ BACK TO TOP ============
(function toTop() {
  const btn = document.createElement("button");
  btn.className = "to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 500);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();
