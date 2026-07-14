/* ============================================================
   SPRITE TRACKER — application logic
   Personal, per-browser collection tracker (localStorage).
   ============================================================ */
(function () {
  "use strict";

  var MAX_LEVEL = 5;               // Level 5 == Mastered
  var STORE_KEY = "fnSpriteTracker:v1";
  var PREFS_KEY = "fnSpriteTracker:prefs:v1";
  var IMG_PATH = "assets/sprites/";

  var SPRITES = (window.SPRITES || []).slice();
  var RELEASED = SPRITES.filter(function (s) { return s.released; });
  var RELEASED_TOTAL = RELEASED.length;

  /* ---------- state ---------- */
  var levels = loadLevels();        // { id: level }
  var prefs = loadPrefs();          // { status, rarity, search, unreleased }

  function loadLevels() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var obj = JSON.parse(raw);
      return (obj && obj.levels) ? obj.levels : {};
    } catch (e) { return {}; }
  }
  function saveLevels() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, levels: levels }));
    } catch (e) {
      toast("Could not save — browser storage may be full or blocked.", "warn");
    }
  }
  function loadPrefs() {
    var d = { status: "all", rarity: "all", search: "", unreleased: false };
    try {
      var raw = localStorage.getItem(PREFS_KEY);
      if (raw) { var p = JSON.parse(raw); for (var k in d) if (k in p) d[k] = p[k]; }
    } catch (e) {}
    return d;
  }
  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  function levelOf(id) { return levels[id] || 0; }
  function setLevel(id, lvl) {
    lvl = Math.max(0, Math.min(MAX_LEVEL, lvl));
    if (lvl === 0) delete levels[id]; else levels[id] = lvl;
    saveLevels();
  }

  /* ---------- element refs ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var grid = $("grid");
  var emptyEl = $("empty");
  var resultNote = $("resultNote");

  /* ---------- filtering ---------- */
  function passesFilters(s) {
    if (!s.released && !prefs.unreleased) return false;
    if (prefs.rarity !== "all" && s.rarity !== prefs.rarity) return false;
    var lvl = levelOf(s.id);
    if (prefs.status === "owned" && lvl < 1) return false;
    if (prefs.status === "missing" && lvl >= 1) return false;
    if (prefs.status === "mastered" && lvl < MAX_LEVEL) return false;
    if (prefs.search) {
      var q = prefs.search.toLowerCase();
      if (s.name.toLowerCase().indexOf(q) === -1 &&
          s.group.toLowerCase().indexOf(q) === -1 &&
          s.rarity.toLowerCase().indexOf(q) === -1) return false;
    }
    return true;
  }

  /* ---------- rendering ---------- */
  function render(animateId) {
    var visible = SPRITES.filter(passesFilters);
    grid.innerHTML = "";

    if (!visible.length) {
      emptyEl.hidden = false;
      resultNote.textContent = "";
      updateStats();
      return;
    }
    emptyEl.hidden = true;

    // group in source order
    var frag = document.createDocumentFragment();
    var currentGroup = null;
    visible.forEach(function (s) {
      if (s.group !== currentGroup) {
        currentGroup = s.group;
        var members = visible.filter(function (x) { return x.group === currentGroup; });
        frag.appendChild(groupHeader(currentGroup, members));
      }
      frag.appendChild(card(s, s.id === animateId));
    });
    grid.appendChild(frag);

    var ownedShown = visible.filter(function (s) { return levelOf(s.id) >= 1; }).length;
    resultNote.textContent = "Showing " + visible.length + " sprite" + (visible.length === 1 ? "" : "s") +
      " · " + ownedShown + " owned in view";
    updateStats();
  }

  function groupHeader(name, members) {
    var owned = members.filter(function (m) { return levelOf(m.id) >= 1; }).length;
    var el = document.createElement("div");
    el.className = "group-head";
    var h = document.createElement("h3"); h.textContent = name;
    var line = document.createElement("div"); line.className = "line";
    var count = document.createElement("span"); count.className = "g-count";
    count.textContent = owned + " / " + members.length;
    el.appendChild(h); el.appendChild(line); el.appendChild(count);
    return el;
  }

  function card(s, animate) {
    var lvl = levelOf(s.id);
    var el = document.createElement("article");
    el.className = "card r-" + s.rarity + " lvl" + lvl + (lvl === MAX_LEVEL ? " mastered" : "");
    el.dataset.id = s.id;

    /* thumb */
    var thumb = document.createElement("div"); thumb.className = "thumb";
    var img = document.createElement("img");
    img.src = IMG_PATH + s.id + ".webp";
    img.alt = s.name + " Sprite";
    img.loading = "lazy";
    img.draggable = false;
    thumb.appendChild(img);

    if (s.pct && s.pct !== "0%") {
      var pct = document.createElement("span"); pct.className = "pct-badge";
      pct.textContent = s.pct + " drop"; thumb.appendChild(pct);
    }
    if (!s.released) {
      var ub = document.createElement("span"); ub.className = "unreleased-badge";
      ub.textContent = "Unreleased"; thumb.appendChild(ub);
    }
    if (lvl === MAX_LEVEL) {
      var crown = document.createElement("span"); crown.className = "crown"; crown.textContent = "👑";
      if (!animate) crown.style.animation = "none";
      thumb.appendChild(crown);
    }
    thumb.title = lvl >= 1 ? "Click to mark as not owned" : "Click to mark as owned";
    thumb.addEventListener("click", function () {
      var cur = levelOf(s.id);
      changeLevel(s.id, cur >= 1 ? 0 : 1);
    });
    el.appendChild(thumb);

    /* body */
    var body = document.createElement("div"); body.className = "card-body";
    var nameRow = document.createElement("div"); nameRow.className = "name-row";
    var nm = document.createElement("span"); nm.className = "sprite-name"; nm.textContent = s.name;
    var rt = document.createElement("span"); rt.className = "rarity-tag";
    rt.textContent = s.rarity === "special" ? "Variant" : s.rarity;
    nameRow.appendChild(nm); nameRow.appendChild(rt);
    body.appendChild(nameRow);

    /* level control */
    var level = document.createElement("div"); level.className = "level";
    var pips = document.createElement("div"); pips.className = "pips";
    for (var i = 1; i <= MAX_LEVEL; i++) {
      (function (n) {
        var p = document.createElement("button");
        p.className = "pip" + (n <= lvl ? " on" : "") + (n === MAX_LEVEL ? " max" : "");
        p.setAttribute("aria-label", "Set level " + n);
        p.title = n === MAX_LEVEL ? "Level 5 — Mastered" : "Level " + n;
        var span = document.createElement("span"); span.textContent = n; p.appendChild(span);
        p.addEventListener("click", function () {
          var cur = levelOf(s.id);
          changeLevel(s.id, cur === n ? n - 1 : n);
        });
        pips.appendChild(p);
      })(i);
    }
    level.appendChild(pips);

    var status = document.createElement("div"); status.className = "level-status";
    var lbl = document.createElement("span"); lbl.className = "lbl";
    lbl.textContent = lvl === 0 ? "Not owned" : (lvl === MAX_LEVEL ? "★ Mastered" : "Level " + lvl);
    var clr = document.createElement("button"); clr.className = "clear"; clr.textContent = "Reset";
    clr.title = "Mark as not owned";
    clr.addEventListener("click", function (e) { e.stopPropagation(); changeLevel(s.id, 0); });
    status.appendChild(lbl); status.appendChild(clr);
    level.appendChild(status);

    body.appendChild(level);
    el.appendChild(body);
    return el;
  }

  function changeLevel(id, newLvl) {
    var prev = levelOf(id);
    if (prev === newLvl) return;
    setLevel(id, newLvl);
    var justMastered = newLvl === MAX_LEVEL && prev !== MAX_LEVEL;

    // If a level-dependent status filter is active, the card may leave the view → full re-render.
    if (prefs.status !== "all") {
      render(justMastered ? id : null);
    } else {
      // in-place update to preserve scroll & feel
      var el = grid.querySelector('.card[data-id="' + id + '"]');
      var s = SPRITES.filter(function (x) { return x.id === id; })[0];
      if (el && s) {
        var fresh = card(s, justMastered);
        el.parentNode.replaceChild(fresh, el);
      } else {
        render(justMastered ? id : null);
      }
      // refresh the owning group's header count
      refreshGroupCounts();
      updateStats();
    }
    if (justMastered) toast("★ " + nameOf(id) + " Mastered!", "good");
  }

  function nameOf(id){ var s=SPRITES.filter(function(x){return x.id===id;})[0]; return s?s.name:"Sprite"; }

  function refreshGroupCounts() {
    var heads = grid.querySelectorAll(".group-head");
    heads.forEach(function (h) {
      var name = h.querySelector("h3").textContent;
      var members = SPRITES.filter(function (s) { return s.group === name && passesFilters(s); });
      var owned = members.filter(function (m) { return levelOf(m.id) >= 1; }).length;
      h.querySelector(".g-count").textContent = owned + " / " + members.length;
    });
  }

  /* ---------- stats ---------- */
  function updateStats() {
    var owned = RELEASED.filter(function (s) { return levelOf(s.id) >= 1; }).length;
    var mastered = RELEASED.filter(function (s) { return levelOf(s.id) >= MAX_LEVEL; }).length;
    $("ownedNum").textContent = owned;
    $("masteredNum").textContent = mastered;
    $("ownedTotal").textContent = RELEASED_TOTAL;
    $("masteredTotal").textContent = RELEASED_TOTAL;
    var op = RELEASED_TOTAL ? Math.round(owned / RELEASED_TOTAL * 100) : 0;
    var mp = RELEASED_TOTAL ? Math.round(mastered / RELEASED_TOTAL * 100) : 0;
    $("ownedPct").textContent = op + "%";
    $("masteredPct").textContent = mp + "%";
    $("ownedRing").style.setProperty("--p", op);
    $("masteredRing").style.setProperty("--p", mp);
  }

  /* ---------- toolbar wiring ---------- */
  function initToolbar() {
    var search = $("search");
    search.value = prefs.search;
    var t;
    search.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { prefs.search = search.value.trim(); savePrefs(); render(); }, 120);
    });

    wireChips("statusFilter", "status", "data-status");
    wireChips("rarityFilter", "rarity", "data-rarity");

    var unrel = $("showUnreleased");
    unrel.checked = !!prefs.unreleased;
    unrel.addEventListener("change", function () {
      prefs.unreleased = unrel.checked; savePrefs(); render();
    });

    initMenu();
    // reflect saved chip state
    syncChips("statusFilter", "status", prefs.status);
    syncChips("rarityFilter", "rarity", prefs.rarity);
  }

  function wireChips(containerId, prefKey, attr) {
    var c = $(containerId);
    c.addEventListener("click", function (e) {
      var b = e.target.closest("button.chip"); if (!b) return;
      var val = b.getAttribute(attr);
      prefs[prefKey] = val; savePrefs();
      syncChips(containerId, prefKey, val);
      render();
    });
  }
  function syncChips(containerId, prefKey, val) {
    var attr = containerId === "statusFilter" ? "data-status" : "data-rarity";
    $(containerId).querySelectorAll("button.chip").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute(attr) === val);
    });
  }

  /* ---------- data menu (export / import / share / reset) ---------- */
  function initMenu() {
    var btn = $("menuBtn"), pop = $("menuPop");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !pop.hidden; pop.hidden = open; btn.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("click", function () { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); });
    pop.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]"); if (!b) return;
      pop.hidden = true;
      var act = b.getAttribute("data-act");
      if (act === "export") doExport();
      else if (act === "import") doImport();
      else if (act === "share") doShare();
      else if (act === "reset") doReset();
    });
  }

  function encode() { return btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, levels: levels })))); }
  function decode(str) {
    var obj = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (!obj || typeof obj.levels !== "object") throw new Error("bad");
    return obj.levels;
  }

  function doExport() {
    var owned = Object.keys(levels).length;
    openModal("Export backup",
      "This code is your entire collection (" + owned + " sprites tracked). Copy it somewhere safe, or paste it into <b>Import</b> on another device or browser.",
      encode(),
      [
        { label: "Copy to clipboard", cls: "btn", act: function (ta) { copy(ta.value); toast("Backup code copied", "good"); } },
        { label: "Download .txt", cls: "btn secondary", act: function (ta) { downloadText("sprite-tracker-backup.txt", ta.value); } },
        { label: "Close", cls: "btn secondary", act: closeModal }
      ], true);
  }

  function doImport() {
    openModal("Import backup",
      "Paste a backup code below and choose how to apply it. <b>Merge</b> keeps your highest level for each sprite; <b>Replace</b> overwrites your current collection.",
      "",
      [
        { label: "Merge", cls: "btn", act: function (ta) { applyImport(ta.value, false); } },
        { label: "Replace", cls: "btn danger", act: function (ta) { applyImport(ta.value, true); } },
        { label: "Cancel", cls: "btn secondary", act: closeModal }
      ], false);
  }

  function applyImport(str, replace) {
    var incoming;
    try { incoming = decode(str); }
    catch (e) { toast("That backup code isn't valid.", "warn"); return; }
    if (replace) {
      levels = {};
      for (var k in incoming) levels[k] = clampLvl(incoming[k]);
    } else {
      for (var id in incoming) {
        var v = clampLvl(incoming[id]);
        if (v > (levels[id] || 0)) levels[id] = v;
      }
    }
    // strip zeros
    for (var z in levels) if (!levels[z]) delete levels[z];
    saveLevels(); closeModal(); render();
    toast((replace ? "Collection replaced" : "Backup merged") + " ✓", "good");
  }
  function clampLvl(v){ v = parseInt(v,10)||0; return Math.max(0, Math.min(MAX_LEVEL, v)); }

  function doShare() {
    var url = location.href.split("#")[0];
    copy(url);
    toast("Link copied — anyone who opens it gets their own tracker", "good");
  }

  function doReset() {
    openModal("Reset collection",
      "This clears every sprite level from <b>this browser</b>. Other devices are unaffected. This can't be undone — export a backup first if unsure.",
      "",
      [
        { label: "Delete everything", cls: "btn danger", act: function () {
            levels = {}; saveLevels(); closeModal(); render(); toast("Collection reset", "warn");
          } },
        { label: "Cancel", cls: "btn secondary", act: closeModal }
      ], false);
    $("modalText").style.display = "none";
  }

  /* ---------- modal ---------- */
  function openModal(title, desc, textValue, actions, showText) {
    $("modalTitle").textContent = title;
    $("modalDesc").innerHTML = desc;
    var ta = $("modalText");
    ta.style.display = showText === false ? (title === "Import backup" ? "block" : "none") : "block";
    if (title === "Import backup") ta.style.display = "block";
    ta.value = textValue || "";
    ta.placeholder = title === "Import backup" ? "Paste your backup code here…" : "";
    var wrap = $("modalActions"); wrap.innerHTML = "";
    actions.forEach(function (a) {
      var b = document.createElement("button"); b.className = a.cls; b.textContent = a.label;
      b.addEventListener("click", function () { a.act(ta); });
      wrap.appendChild(b);
    });
    $("modalScrim").hidden = false;
    if (showText) { ta.focus(); ta.select(); }
  }
  function closeModal() { $("modalScrim").hidden = true; $("modalText").style.display = "block"; }

  function initModal() {
    $("modalClose").addEventListener("click", closeModal);
    $("modalScrim").addEventListener("click", function (e) { if (e.target === $("modalScrim")) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }

  /* ---------- helpers ---------- */
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(fallbackCopy.bind(null, text));
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea"); ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta);
    ta.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta);
  }
  function downloadText(name, text) {
    var blob = new Blob([text], { type: "text/plain" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("Backup downloaded", "good");
  }
  var toastTimer;
  function toast(msg, kind) {
    var t = $("toast"); t.textContent = msg;
    t.className = "toast show" + (kind ? " " + kind : "");
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 2600);
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (!SPRITES.length) {
      grid.innerHTML = '<p class="empty">Sprite data failed to load.</p>';
      return;
    }
    initToolbar();
    initModal();
    render();
  });
})();
