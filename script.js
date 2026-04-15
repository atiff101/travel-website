/* =========================================================================
   London Travel Guide — Interactions
   UX notes: favourites persist via localStorage so users keep their
   shortlist across pages and sessions. A live counter in the nav gives
   constant feedback. Toasts confirm actions without modal interruption.
   ========================================================================= */

// ─── Active Nav Link ──────────────────────────────────────────────────────
(function highlightActiveNav() {
  const currentPage = location.pathname.split("/").pop() || "home.html";
  document.querySelectorAll(".main-navigation a[href]").forEach((link) => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (linkPage === currentPage) link.classList.add("active-nav");
  });
})();

// ─── Favourites Counter (runs on every page) ──────────────────────────────
function getFavourites() {
  try {
    return JSON.parse(localStorage.getItem("fav-places") || "[]");
  } catch {
    return [];
  }
}
function setFavourites(list) {
  localStorage.setItem("fav-places", JSON.stringify(list));
  updateFavCounter();
}
function updateFavCounter() {
  const counter = document.querySelector(".fav-counter");
  if (!counter) return;
  const count = getFavourites().length;
  counter.dataset.count = count;
  counter.querySelector(".fav-count-num").textContent = count;
}
updateFavCounter();

// ─── Toast helper ─────────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 1800);
}

// ─── Scroll Fade-in ───────────────────────────────────────────────────────
(function scrollReveal() {
  const targets = document.querySelectorAll(".review, .tip, .place-card, .transport-section");
  if (!targets.length) return;
  targets.forEach((el) => el.classList.add("reveal-hidden"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach((el) => observer.observe(el));
})();

// ─── Places: Search + Category Filters ────────────────────────────────────
(function placesFilter() {
  const placesBox = document.getElementById("places-box");
  const input = document.getElementById("place-search");
  const chips = document.querySelectorAll(".chip");
  if (!placesBox || !input) return;

  const cards = placesBox.querySelectorAll(".place-card");
  let activeCategory = "all";
  let activeQuery = "";

  function applyFilters() {
    let visibleCount = 0;
    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const cat = card.dataset.category || "";
      const matchesQuery = !activeQuery || text.includes(activeQuery);
      const matchesCat = activeCategory === "all" || cat === activeCategory;
      const visible = matchesQuery && matchesCat;
      card.style.display = visible ? "" : "none";
      if (visible) visibleCount++;
    });

    let noResults = placesBox.querySelector(".no-results");
    if (visibleCount === 0) {
      if (!noResults) {
        noResults = document.createElement("p");
        noResults.className = "no-results";
        noResults.textContent = "No places match your search. Try a different filter.";
        placesBox.appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
  }

  input.addEventListener("input", () => {
    activeQuery = input.value.toLowerCase().trim();
    applyFilters();
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeCategory = chip.dataset.filter || "all";
      applyFilters();
    });
  });
})();

// ─── Places: Favourite Toggle (uses localStorage by place id) ─────────────
(function favourites() {
  const cards = document.querySelectorAll(".place-card[data-place-id]");
  if (!cards.length) return;

  let saved = getFavourites();

  cards.forEach((card) => {
    const id = card.dataset.placeId;
    const name = card.querySelector("h3")?.textContent || "Place";

    const btn = document.createElement("button");
    btn.className = "fav-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", `Save ${name} to favourites`);

    function render() {
      const isFav = saved.includes(id);
      btn.innerHTML = isFav ? "♥ Saved" : "♡ Save";
      btn.classList.toggle("fav-active", isFav);
      btn.setAttribute("aria-pressed", isFav.toString());
    }
    render();

    btn.addEventListener("click", () => {
      saved = getFavourites();
      const isFav = saved.includes(id);
      if (isFav) {
        saved = saved.filter((x) => x !== id);
        showToast(`Removed ${name} from favourites`);
      } else {
        saved.push(id);
        showToast(`Saved ${name} to favourites`);
      }
      setFavourites(saved);
      render();
    });

    const actions = card.querySelector(".card-actions");
    const mapLink = card.querySelector(".map-link");
    if (actions && mapLink) actions.insertBefore(btn, mapLink);
  });
})();

// ─── Tips: Accordion ──────────────────────────────────────────────────────
(function tipsAccordion() {
  const tipArticle = document.querySelector("#tips-list .tip");
  if (!tipArticle) return;

  const children = Array.from(tipArticle.childNodes);
  const panels = [];
  let current = null;
  children.forEach((node) => {
    if (node.nodeName === "H3") {
      current = { heading: node, content: [] };
      panels.push(current);
    } else if (current && node.nodeType === 1) {
      current.content.push(node);
    } else if (current && node.nodeType === 3 && node.textContent.trim()) {
      current.content.push(node);
    }
  });
  if (!panels.length) return;

  tipArticle.innerHTML = "";

  panels.forEach((panel, i) => {
    const item = document.createElement("div");
    item.className = "accordion-item" + (i === 0 ? " open" : "");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "accordion-trigger";
    trigger.setAttribute("aria-expanded", i === 0 ? "true" : "false");
    trigger.innerHTML = `<span>${panel.heading.textContent}</span><span class="accordion-icon" aria-hidden="true">+</span>`;

    const body = document.createElement("div");
    body.className = "accordion-body";
    panel.content.forEach((node) => body.appendChild(node.cloneNode(true)));
    if (i !== 0) body.style.display = "none";

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".accordion-item").forEach((el) => {
        el.classList.remove("open");
        el.querySelector(".accordion-trigger").setAttribute("aria-expanded", "false");
        el.querySelector(".accordion-body").style.display = "none";
      });
      if (!isOpen) {
        item.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
        body.style.display = "block";
      }
    });

    item.appendChild(trigger);
    item.appendChild(body);
    tipArticle.appendChild(item);
  });
})();

// ─── Transport: Smooth Scroll + Active Sidebar Link ───────────────────────
(function transportNav() {
  const sideLinks = document.querySelectorAll(".second-navigation a");
  if (!sideLinks.length) return;

  sideLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href").replace("#", "");
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#" + targetId);
      }
    });
  });

  const sections = Array.from(sideLinks)
    .map((link) => document.getElementById(link.getAttribute("href").replace("#", "")))
    .filter(Boolean);

  const onScroll = () => {
    let current = sections[0];
    sections.forEach((sec) => {
      if (window.scrollY >= sec.offsetTop - 140) current = sec;
    });
    sideLinks.forEach((link) => {
      link.classList.toggle(
        "active-sidebar",
        link.getAttribute("href") === "#" + current.id
      );
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
