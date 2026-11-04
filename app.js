/**
 * app.js
 * The Complete Genomics to Precision Medicine Atlas & Interview Arena
 * Integrates:
 * - Fullscreen 10-Layer Visual Knowledge Graph Canvas
 * - Collapsible Sidebar & Pathfinder
 * - Dual-Mode Learning: Atlas Map, Split Coach View & Fullscreen Interview Arena Deck
 * - Gamified Progression (Diagnostic Yield %, Valuation $, Lab Readiness Rank, localStorage)
 * - 27 Multi-Persona & Multi-Tier High-Signal Precision Medicine Questions
 * - One-Click "Quiz Me on This Dot"
 * - Master Directory of External Literature & Business Hubs
 */

document.addEventListener("DOMContentLoaded", () => {
  const atlasData = window.ATLAS_DATA;
  const interviewData = window.INTERVIEW_DATA;

  if (!atlasData) {
    console.error("ATLAS_DATA not loaded! Check atlas_data.js");
    return;
  }

  // --- Initialize Graph Engine ---
  const graph = new GenomicsGraphEngine("graph-canvas-container", atlasData, {
    onNodeSelect: (node) => {
      openInspector(node);
    },
    onNodeHover: (node, screenX, screenY) => {
      updateTooltip(node, screenX, screenY);
    },
    onCanvasClick: () => {
      closeInspector();
    }
  });

  // --- App State ---
  const state = {
    viewMode: "atlas", // "atlas", "coach", "arena"
    activeQuestionIndex: 0,
    filterLevel: "all",
    filterPersona: "all",
    filterNode: null,
    searchQuery: "",
    filteredQuestions: [...interviewData.questions],
    progress: loadProgress()
  };

  function loadProgress() {
    try {
      const saved = localStorage.getItem("genomics_arena_progress");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load progress from localStorage", e);
    }
    return { mastered: [], review: [] };
  }

  function saveProgress() {
    try {
      localStorage.setItem("genomics_arena_progress", JSON.stringify(state.progress));
    } catch (e) {
      console.warn("Could not save progress", e);
    }
    updateGamificationUI();
  }

  // --- DOM Elements ---
  const appSidebar = document.getElementById("app-sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const btnFloatingSidebar = document.getElementById("btn-floating-sidebar");
  const btnCollapseSidebar = document.getElementById("btn-collapse-sidebar");
  const btnSidebarCollapseFooter = document.getElementById("btn-sidebar-collapse-footer");
  const searchInput = document.getElementById("global-search");
  const searchDropdown = document.getElementById("search-results-dropdown");
  const inspectorDrawer = document.getElementById("inspector-drawer");
  const drawerCloseBtn = document.getElementById("drawer-close-btn");
  const tooltipEl = document.getElementById("graph-tooltip");
  
  // Pathfinder Modal Elements
  const pathfinderModal = document.getElementById("pathfinder-modal");
  const btnClosePathfinder = document.getElementById("btn-close-pathfinder");
  const btnRunPathfinder = document.getElementById("btn-run-pathfinder");
  const pathStartSelect = document.getElementById("path-start-select");
  const pathTargetSelect = document.getElementById("path-target-select");
  const pathResultBox = document.getElementById("path-result-box");
  const pathStepsFlow = document.getElementById("path-steps-flow");
  const pathStatsSummary = document.getElementById("path-stats-summary");

  // Arena & Modals Elements
  const questionMatrixModal = document.getElementById("question-matrix-modal");
  const bossBattlesModal = document.getElementById("boss-battles-modal");
  const externalHubsModal = document.getElementById("external-hubs-modal");

  // --- View Mode Management ---
  function setViewMode(mode) {
    state.viewMode = mode;
    document.body.className = "view-" + mode;

    document.querySelectorAll(".btn-view-mode").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === mode);
    });

    if (mode === "coach" || mode === "atlas") {
      setTimeout(() => {
        graph.resizeCanvas();
        graph.fitToScreen();
      }, 150);
    }

    if (mode === "coach") {
      // In coach view, focus graph on current question's primary node
      const currentQ = state.filteredQuestions[state.activeQuestionIndex];
      if (currentQ && currentQ.primaryNode) {
        setTimeout(() => {
          graph.panToNode(currentQ.primaryNode);
        }, 250);
      }
    }
  }

  document.querySelectorAll(".btn-view-mode").forEach(btn => {
    btn.addEventListener("click", () => {
      setViewMode(btn.getAttribute("data-view"));
    });
  });

  document.querySelector(".btn-sidebar-mode-atlas")?.addEventListener("click", () => {
    setViewMode("atlas");
    collapseSidebar();
  });
  document.querySelector(".btn-sidebar-mode-coach")?.addEventListener("click", () => {
    setViewMode("coach");
    collapseSidebar();
  });
  document.querySelector(".btn-sidebar-mode-arena")?.addEventListener("click", () => {
    setViewMode("arena");
    collapseSidebar();
  });
  document.getElementById("btn-arena-exit")?.addEventListener("click", () => {
    setViewMode("atlas");
  });

  // --- Gamified Progression Engine ---
  function updateGamificationUI() {
    const total = interviewData.questions.length;
    const masteredCount = state.progress.mastered.length;
    const pct = Math.min(100, Math.round((masteredCount / total) * 100));

    // Diagnostic Yield: 15% base -> 98%
    const yieldRate = 15 + Math.round((masteredCount / total) * 83);
    // Series A Valuation: $1.5M base -> $50.0M
    const valuation = (1.5 + (masteredCount / total) * 48.5).toFixed(1);

    // Rank logic
    let rankTitle = "Genomics Explorer";
    let rankIcon = "🧬";
    if (masteredCount >= 19) {
      rankTitle = "Chief Scientific Officer (CSO)";
      rankIcon = "👑";
    } else if (masteredCount >= 9) {
      rankTitle = "Pipeline Architect";
      rankIcon = "⚡";
    }

    // Update Floating HUD elements
    document.getElementById("hud-rank-title").textContent = rankTitle;
    document.getElementById("hud-rank-icon").textContent = rankIcon;
    document.getElementById("hud-yield-pct").textContent = `${yieldRate}%`;
    document.getElementById("hud-valuation-amt").textContent = `$${valuation}M`;
    document.getElementById("hud-mastered-count").textContent = `${masteredCount}/${total}`;

    // Update Arena Top Bar elements
    document.getElementById("arena-rank-title").textContent = rankTitle;
    document.getElementById("arena-rank-icon").textContent = rankIcon;
    document.getElementById("arena-yield-pct").textContent = `${yieldRate}%`;
    document.getElementById("arena-valuation-amt").textContent = `$${valuation}M`;
    document.getElementById("arena-mastered-text").textContent = `${masteredCount} / ${total} Mastered (${pct}%)`;
    document.getElementById("arena-progress-bar-fill").style.width = `${pct}%`;
  }

  // --- Sidebar Expand / Collapse Logic ---
  function expandSidebar() {
    appSidebar.classList.add("expanded");
    sidebarBackdrop.classList.add("active");
    btnFloatingSidebar.style.opacity = "0";
    btnFloatingSidebar.style.pointerEvents = "none";
    setTimeout(() => graph.resizeCanvas(), 360);
  }

  function collapseSidebar() {
    appSidebar.classList.remove("expanded");
    sidebarBackdrop.classList.remove("active");
    btnFloatingSidebar.style.opacity = "1";
    btnFloatingSidebar.style.pointerEvents = "auto";
    setTimeout(() => graph.resizeCanvas(), 360);
  }

  function toggleSidebar() {
    if (appSidebar.classList.contains("expanded")) collapseSidebar();
    else expandSidebar();
  }

  btnFloatingSidebar?.addEventListener("click", toggleSidebar);
  btnCollapseSidebar?.addEventListener("click", collapseSidebar);
  btnSidebarCollapseFooter?.addEventListener("click", collapseSidebar);
  sidebarBackdrop?.addEventListener("click", collapseSidebar);

  // --- Render Layer Filter Strip in Sidebar ---
  const layersContainer = document.getElementById("sidebar-layers-container");
  if (layersContainer) {
    const allRow = document.createElement("div");
    allRow.className = "sidebar-layer-row active";
    allRow.id = "filter-layer-all";
    allRow.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:12px;">🌐</span>
        <span style="font-weight:600;">All 10 Layers</span>
      </div>
      <span class="layer-count">${atlasData.nodes.length}</span>
    `;
    allRow.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-layer-row").forEach(r => r.classList.remove("active"));
      allRow.classList.add("active");
      graph.filterByLayer(null);
    });
    layersContainer.appendChild(allRow);

    for (let l = 1; l <= 10; l++) {
      const layerCfg = atlasData.metadata.layers[l];
      if (!layerCfg) continue;
      const layerNodes = atlasData.nodes.filter(n => n.layer === l);

      const row = document.createElement("div");
      row.className = "sidebar-layer-row";
      row.style.setProperty("--row-color", layerCfg.color);
      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="layer-dot" style="--dot-color:${layerCfg.color};"></span>
          <span><b>L${l}:</b> ${layerCfg.name.split("&")[0].trim()}</span>
        </div>
        <span class="layer-count">${layerNodes.length}</span>
      `;
      row.addEventListener("click", () => {
        document.querySelectorAll(".sidebar-layer-row").forEach(r => r.classList.remove("active"));
        row.classList.add("active");
        graph.filterByLayer(l);
      });
      layersContainer.appendChild(row);
    }
  }

  // --- Populate Pathfinder Dropdowns ---
  if (pathStartSelect && pathTargetSelect) {
    atlasData.nodes.forEach(n => {
      const opt1 = document.createElement("option");
      opt1.value = n.id;
      opt1.textContent = `${n.id}: ${n.title} (Layer ${n.layer})`;
      pathStartSelect.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = n.id;
      opt2.textContent = `${n.id}: ${n.title} (Layer ${n.layer})`;
      pathTargetSelect.appendChild(opt2);
    });
    pathStartSelect.value = "N01";
    pathTargetSelect.value = "N36";
  }

  // --- Layout Switcher Buttons ---
  document.querySelectorAll(".btn-sidebar-layout").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-sidebar-layout").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const layout = btn.getAttribute("data-layout");
      graph.applyLayout(layout);
    });
  });

  // --- Fullscreen Toggle ---
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }
  document.getElementById("btn-hud-fullscreen")?.addEventListener("click", toggleFullscreen);
  document.getElementById("btn-sidebar-fullscreen")?.addEventListener("click", toggleFullscreen);

  // --- Fit View Buttons ---
  document.getElementById("btn-hud-fit")?.addEventListener("click", () => graph.fitToScreen());
  document.getElementById("btn-sidebar-fit")?.addEventListener("click", () => graph.fitToScreen());

  // --- Canvas Floating Action Buttons ---
  document.getElementById("btn-zoom-in")?.addEventListener("click", () => {
    graph.zoom = Math.min(4.0, graph.zoom * 1.25);
  });
  document.getElementById("btn-zoom-out")?.addEventListener("click", () => {
    graph.zoom = Math.max(0.2, graph.zoom * 0.8);
  });
  document.getElementById("btn-toggle-labels")?.addEventListener("click", (e) => {
    graph.showLabels = !graph.showLabels;
    e.currentTarget.style.color = graph.showLabels ? "var(--text-primary)" : "var(--text-muted)";
  });
  document.getElementById("btn-toggle-flow")?.addEventListener("click", (e) => {
    graph.animateFlow = !graph.animateFlow;
    e.currentTarget.style.color = graph.animateFlow ? "var(--text-primary)" : "var(--text-muted)";
  });

  // --- Global Keyword Search & Autocomplete ---
  const searchIndex = [];
  atlasData.nodes.forEach(n => {
    searchIndex.push({
      type: "node",
      nodeId: n.id,
      title: `${n.id}: ${n.title}`,
      subtitle: `Layer ${n.layer}: ${n.layerName}`,
      layerColor: n.layerColor,
      text: `${n.id} ${n.title} ${n.layerName}`.toLowerCase()
    });
    (n.tools || []).forEach(tool => {
      searchIndex.push({
        type: "tool",
        nodeId: n.id,
        title: tool,
        subtitle: `Tool in ${n.id}: ${n.title}`,
        layerColor: n.layerColor,
        text: tool.toLowerCase()
      });
    });
    (n.companies || []).forEach(comp => {
      searchIndex.push({
        type: "company",
        nodeId: n.id,
        title: comp,
        subtitle: `Company in ${n.id}: ${n.title}`,
        layerColor: n.layerColor,
        text: comp.toLowerCase()
      });
    });
    (n.keywords || []).forEach(kw => {
      searchIndex.push({
        type: "keyword",
        nodeId: n.id,
        title: kw,
        subtitle: `Keyword in ${n.id}: ${n.title}`,
        layerColor: n.layerColor,
        text: kw.toLowerCase()
      });
    });
  });

  searchInput?.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      searchDropdown.style.display = "none";
      return;
    }
    const matched = [];
    const seenTitles = new Set();
    for (const item of searchIndex) {
      if (item.text.includes(query) && !seenTitles.has(item.title.toLowerCase())) {
        seenTitles.add(item.title.toLowerCase());
        matched.push(item);
        if (matched.length >= 10) break;
      }
    }
    if (matched.length === 0) {
      searchDropdown.innerHTML = `<div style="padding:10px;font-size:11px;color:var(--text-muted);">No matching concepts or keywords found.</div>`;
      searchDropdown.style.display = "block";
      return;
    }
    searchDropdown.innerHTML = "";
    matched.forEach(m => {
      const div = document.createElement("div");
      div.className = "search-result-item";
      div.innerHTML = `
        <div>
          <div class="search-result-title">${m.title}</div>
          <div class="search-result-match">${m.subtitle}</div>
        </div>
        <span class="search-result-badge" style="background:${m.layerColor}22;color:${m.layerColor};border:1px solid ${m.layerColor}55;">
          ${m.type.toUpperCase()}
        </span>
      `;
      div.addEventListener("click", () => {
        searchDropdown.style.display = "none";
        searchInput.value = m.title;
        graph.panToNode(m.nodeId);
      });
      searchDropdown.appendChild(div);
    });
    searchDropdown.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (searchInput && !searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.style.display = "none";
    }
  });

  // --- KEYBOARD SHORTCUTS & ESCAPE MINIMIZATION ---
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // Priority 1: Close active modals
      if (questionMatrixModal.classList.contains("open")) {
        questionMatrixModal.classList.remove("open");
        return;
      }
      if (bossBattlesModal.classList.contains("open")) {
        bossBattlesModal.classList.remove("open");
        return;
      }
      if (externalHubsModal.classList.contains("open")) {
        externalHubsModal.classList.remove("open");
        return;
      }
      if (pathfinderModal.classList.contains("open")) {
        pathfinderModal.classList.remove("open");
        return;
      }
      // Priority 2: Close Concept Inspector drawer
      if (inspectorDrawer.classList.contains("open")) {
        closeInspector();
        return;
      }
      // Priority 3: Collapse sidebar
      if (appSidebar.classList.contains("expanded")) {
        collapseSidebar();
        return;
      }
      // Priority 4: If in arena or coach mode, return to atlas
      if (state.viewMode !== "atlas") {
        setViewMode("atlas");
        return;
      }
      // Fallback: Toggle sidebar
      toggleSidebar();
    } else if ((e.key === "/" && document.activeElement !== searchInput) || (e.ctrlKey && e.key === "k")) {
      e.preventDefault();
      if (!appSidebar.classList.contains("expanded")) expandSidebar();
      searchInput.focus();
      searchInput.select();
    } else if (state.viewMode === "coach" || state.viewMode === "arena") {
      // In Arena/Coach View: Arrow keys navigate questions
      if (e.key === "ArrowRight" || e.key === "n" || e.key === "N") {
        if (document.activeElement.tagName !== "INPUT") nextQuestion();
      } else if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P") {
        if (document.activeElement.tagName !== "INPUT") prevQuestion();
      } else if (e.key === " " && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        revealCurrentQuestionAnswer();
      }
    }
  });

  // --- Tooltip Handler ---
  function updateTooltip(node, screenX, screenY) {
    if (!node) {
      tooltipEl.style.display = "none";
      return;
    }
    tooltipEl.innerHTML = `
      <div class="tooltip-title">${node.id}: ${node.title}</div>
      <div style="font-size:10px;color:${node.baseColor};font-weight:600;margin-bottom:4px;">${node.layerBadge}: ${node.layerName}</div>
      <div class="tooltip-desc">${node.coreConcept ? node.coreConcept.substring(0, 110) + "..." : ""}</div>
      <div style="margin-top:6px;font-size:10px;color:var(--text-muted);">
        Upstream: <b style="color:var(--cyan-upstream)">${(node.upstream || []).length}</b> | Downstream: <b style="color:var(--emerald-downstream)">${(node.downstream || []).length}</b>
      </div>
    `;
    tooltipEl.style.left = (screenX + 14) + "px";
    tooltipEl.style.top = (screenY + 14) + "px";
    tooltipEl.style.display = "block";
  }

  // --- Concept Inspector Drawer ---
  let currentlySelectedNode = null;

  function openInspector(node) {
    if (!node) return;
    currentlySelectedNode = node;
    inspectorDrawer.classList.add("open");

    // Populate Header
    document.getElementById("drawer-node-id").textContent = node.id;
    const layerBadge = document.getElementById("drawer-layer-badge");
    layerBadge.textContent = `${node.layerBadge}: ${node.layerName}`;
    layerBadge.style.backgroundColor = `${node.layerColor}22`;
    layerBadge.style.color = node.layerColor;
    layerBadge.style.border = `1px solid ${node.layerColor}66`;

    document.getElementById("drawer-title").textContent = node.title;

    // Core Concept
    const conceptBox = document.getElementById("drawer-core-concept");
    conceptBox.style.setProperty("--callout-color", node.layerColor);
    conceptBox.innerHTML = renderMarkdown(node.coreConcept || "No summary available.");

    // Formulas
    const formulasSection = document.getElementById("drawer-formulas-section");
    const formulasContainer = document.getElementById("drawer-formulas-container");
    if (node.formulas && node.formulas.length > 0) {
      formulasSection.style.display = "flex";
      formulasContainer.innerHTML = "";
      node.formulas.forEach(form => {
        const fDiv = document.createElement("div");
        fDiv.className = "formula-card";
        fDiv.innerHTML = renderMath(form);
        formulasContainer.appendChild(fDiv);
      });
    } else {
      formulasSection.style.display = "none";
    }

    // Tools & Databases
    const toolsWrap = document.getElementById("drawer-tools-wrap");
    toolsWrap.innerHTML = "";
    if (node.tools && node.tools.length > 0) {
      node.tools.forEach(tool => {
        const span = document.createElement("span");
        span.className = "tech-badge tool";
        span.innerHTML = `⚙️ ${tool}`;
        toolsWrap.appendChild(span);
      });
    } else {
      toolsWrap.innerHTML = `<span style="font-size:11px;color:var(--text-muted)">None listed</span>`;
    }

    // Companies
    const companiesWrap = document.getElementById("drawer-companies-wrap");
    companiesWrap.innerHTML = "";
    if (node.companies && node.companies.length > 0) {
      node.companies.forEach(comp => {
        const span = document.createElement("span");
        span.className = "tech-badge company";
        span.innerHTML = `🏢 ${comp}`;
        companiesWrap.appendChild(span);
      });
    } else {
      companiesWrap.innerHTML = `<span style="font-size:11px;color:var(--text-muted)">None listed</span>`;
    }

    // Keywords
    const keywordsWrap = document.getElementById("drawer-keywords-wrap");
    keywordsWrap.innerHTML = "";
    if (node.keywords && node.keywords.length > 0) {
      node.keywords.forEach(kw => {
        const span = document.createElement("span");
        span.className = "tech-badge";
        span.textContent = kw;
        keywordsWrap.appendChild(span);
      });
    }

    // Upstream Navigation Pills
    const upstreamWrap = document.getElementById("drawer-upstream-pills");
    upstreamWrap.innerHTML = "";
    if (node.upstream && node.upstream.length > 0) {
      node.upstream.forEach(upId => {
        const upNode = atlasData.nodes.find(n => n.id === upId);
        if (!upNode) return;
        const pill = document.createElement("span");
        pill.className = "nav-pill upstream";
        pill.innerHTML = `⬆️ <b>${upNode.id}</b>: ${upNode.title.split(",")[0].split("(")[0]}`;
        pill.addEventListener("click", () => {
          graph.panToNode(upNode.id);
        });
        upstreamWrap.appendChild(pill);
      });
    } else {
      upstreamWrap.innerHTML = `<span style="font-size:11px;color:var(--text-muted)">Root node (no upstream dependencies)</span>`;
    }

    // Downstream Navigation Pills
    const downstreamWrap = document.getElementById("drawer-downstream-pills");
    downstreamWrap.innerHTML = "";
    if (node.downstream && node.downstream.length > 0) {
      node.downstream.forEach(dnId => {
        const dnNode = atlasData.nodes.find(n => n.id === dnId);
        if (!dnNode) return;
        const pill = document.createElement("span");
        pill.className = "nav-pill downstream";
        pill.innerHTML = `⬇️ <b>${dnNode.id}</b>: ${dnNode.title.split(",")[0].split("(")[0]}`;
        pill.addEventListener("click", () => {
          graph.panToNode(dnNode.id);
        });
        downstreamWrap.appendChild(pill);
      });
    } else {
      downstreamWrap.innerHTML = `<span style="font-size:11px;color:var(--text-muted)">Terminal node (end of pipeline)</span>`;
    }

    // Full Detailed Specification (Markdown)
    const richBody = document.getElementById("drawer-rich-body");
    richBody.innerHTML = renderMarkdown(node.rawBody || "");

    // Action: Trace Paths From Here
    document.getElementById("btn-drawer-trace").onclick = () => {
      openPathfinderWithStart(node.id);
    };

    // Action: One-Click "🎯 Quiz Me on This Dot"
    document.getElementById("btn-drawer-quiz-node").onclick = () => {
      quizNodeInArena(node.id);
    };

    // KaTeX render in drawer
    if (window.renderMathInElement) {
      window.renderMathInElement(inspectorDrawer, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  }

  function closeInspector() {
    inspectorDrawer.classList.remove("open");
    currentlySelectedNode = null;
  }

  drawerCloseBtn?.addEventListener("click", closeInspector);

  // --- One-Click "🎯 Quiz Me on This Dot" Action ---
  function quizNodeInArena(nodeId) {
    // Find questions matching this node
    const matching = interviewData.questions.filter(q => 
      q.primaryNode === nodeId || (q.nodeIds && q.nodeIds.includes(nodeId))
    );

    if (matching.length > 0) {
      // Filter arena to this node
      filterArenaByNode(nodeId);
      setViewMode("coach");
      closeInspector();
    } else {
      // General question for this layer
      const node = atlasData.nodes.find(n => n.id === nodeId);
      const layerQuestions = interviewData.questions.filter(q => q.layer === node.layer);
      if (layerQuestions.length > 0) {
        state.filteredQuestions = layerQuestions;
        state.activeQuestionIndex = 0;
        renderActiveQuestion();
        setViewMode("coach");
        closeInspector();
      } else {
        alert(`No direct quiz question for ${nodeId} yet. Showing full Question Bank!`);
        clearNodeFilter();
        setViewMode("coach");
        closeInspector();
      }
    }
  }

  // --- INTERVIEW ARENA ENGINE ---

  function applyArenaFilters() {
    state.filteredQuestions = interviewData.questions.filter(q => {
      // Level filter
      if (state.filterLevel !== "all" && q.level !== state.filterLevel) return false;
      // Persona filter
      if (state.filterPersona !== "all" && q.persona !== state.filterPersona) return false;
      // Node filter
      if (state.filterNode) {
        const matchesPrimary = q.primaryNode === state.filterNode;
        const matchesAny = q.nodeIds && q.nodeIds.includes(state.filterNode);
        if (!matchesPrimary && !matchesAny) return false;
      }
      // Search query
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const inQuestion = q.question.toLowerCase().includes(query);
        const inAnswer = q.hireMeAnswer.toLowerCase().includes(query);
        const inId = q.id.toLowerCase().includes(query);
        if (!inQuestion && !inAnswer && !inId) return false;
      }
      return true;
    });

    state.activeQuestionIndex = 0;
    renderActiveQuestion();
  }

  function filterArenaByNode(nodeId) {
    state.filterNode = nodeId;
    document.getElementById("arena-active-node-filter").style.display = "flex";
    document.getElementById("arena-filtered-node-id").textContent = nodeId;
    applyArenaFilters();
  }

  function clearNodeFilter() {
    state.filterNode = null;
    document.getElementById("arena-active-node-filter").style.display = "none";
    applyArenaFilters();
  }

  document.getElementById("btn-clear-node-filter")?.addEventListener("click", clearNodeFilter);

  // Difficulty filter pills
  document.querySelectorAll("#arena-diff-filters .arena-filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#arena-diff-filters .arena-filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.filterLevel = pill.getAttribute("data-level");
      applyArenaFilters();
    });
  });

  // Persona filter pills
  document.querySelectorAll("#arena-persona-filters .arena-filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#arena-persona-filters .arena-filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.filterPersona = pill.getAttribute("data-persona");
      applyArenaFilters();
    });
  });

  // Arena Question Search input
  document.getElementById("arena-question-search")?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim();
    applyArenaFilters();
  });

  // Navigation handlers
  function nextQuestion() {
    if (state.filteredQuestions.length === 0) return;
    state.activeQuestionIndex = (state.activeQuestionIndex + 1) % state.filteredQuestions.length;
    renderActiveQuestion();
  }

  function prevQuestion() {
    if (state.filteredQuestions.length === 0) return;
    state.activeQuestionIndex = (state.activeQuestionIndex - 1 + state.filteredQuestions.length) % state.filteredQuestions.length;
    renderActiveQuestion();
  }

  function randomQuestion() {
    if (state.filteredQuestions.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * state.filteredQuestions.length);
    if (nextIdx === state.activeQuestionIndex) {
      nextIdx = (nextIdx + 1) % state.filteredQuestions.length;
    }
    state.activeQuestionIndex = nextIdx;
    renderActiveQuestion();
  }

  document.getElementById("btn-card-next")?.addEventListener("click", nextQuestion);
  document.getElementById("btn-card-prev")?.addEventListener("click", prevQuestion);
  document.getElementById("btn-card-random")?.addEventListener("click", randomQuestion);

  // Render Active Question
  function renderActiveQuestion() {
    const cardEl = document.getElementById("active-interview-card");
    const revealSec = document.getElementById("card-reveal-section");
    revealSec.classList.remove("active");

    const count = state.filteredQuestions.length;
    if (count === 0) {
      document.getElementById("card-current-num").textContent = "0";
      document.getElementById("card-total-num").textContent = "0";
      document.getElementById("card-question-text").textContent = "No questions match your current filters. Click 'All' or clear search to reset.";
      cardEl.className = "interview-card";
      return;
    }

    const q = state.filteredQuestions[state.activeQuestionIndex];
    document.getElementById("card-current-num").textContent = (state.activeQuestionIndex + 1);
    document.getElementById("card-total-num").textContent = count;

    // Card Persona Theme
    cardEl.className = `interview-card persona-${q.persona}`;

    // Badges
    document.getElementById("card-qid-badge").textContent = q.id;
    document.getElementById("card-layer-tag").textContent = `Layer ${q.layer}: ${q.layerName.split('&')[0].trim()}`;

    // Primary Node Pill
    const primaryNodeObj = atlasData.nodes.find(n => n.id === q.primaryNode);
    const primaryNodePill = document.getElementById("card-primary-node-pill");
    if (primaryNodeObj) {
      primaryNodePill.textContent = `${primaryNodeObj.id}: ${primaryNodeObj.title.split(',')[0].split('(')[0]}`;
      primaryNodePill.onclick = () => {
        graph.panToNode(primaryNodeObj.id);
      };
    } else {
      primaryNodePill.textContent = q.primaryNode;
    }

    // Persona Badge
    const personaBadge = document.getElementById("card-persona-badge");
    const pCfg = interviewData.metadata.personas[q.persona];
    personaBadge.className = `card-persona-badge ${q.persona}`;
    personaBadge.innerHTML = `${pCfg.icon} ${pCfg.name}`;

    // Difficulty Badge
    const diffBadge = document.getElementById("card-difficulty-badge");
    const dCfg = interviewData.metadata.difficulties[q.level];
    diffBadge.className = `card-difficulty-badge ${q.level}`;
    diffBadge.textContent = `${dCfg.icon} ${dCfg.name.split(' ')[0]}`;

    // Mastered Indicator
    const isMastered = state.progress.mastered.includes(q.id);
    const isReview = state.progress.review.includes(q.id);
    const masteredIndicator = document.getElementById("card-mastered-indicator");
    if (isMastered) {
      masteredIndicator.style.display = "inline-flex";
      masteredIndicator.className = "card-difficulty-badge beginner";
      masteredIndicator.textContent = "✅ Mastered";
    } else if (isReview) {
      masteredIndicator.style.display = "inline-flex";
      masteredIndicator.className = "card-difficulty-badge medium";
      masteredIndicator.textContent = "🔁 Review Later";
    } else {
      masteredIndicator.style.display = "none";
    }

    // Question Text
    document.getElementById("card-question-text").textContent = `"${q.question}"`;

    // Render Math in Question Text if any
    renderMathInElementIfAvailable(document.getElementById("card-question-text"));

    // Populate Hire-Me Answer
    const answerContentEl = document.getElementById("card-hire-me-content");
    answerContentEl.innerHTML = renderMarkdown(q.hireMeAnswer);
    renderMathInElementIfAvailable(answerContentEl);

    // Populate Clickable Internal Node Pills
    const internalPillsWrap = document.getElementById("card-internal-pills");
    internalPillsWrap.innerHTML = "";
    (q.internalLinks || []).forEach(link => {
      const pill = document.createElement("span");
      pill.className = "atlas-keyword-pill";
      pill.innerHTML = `📍 <b>[#${link.id}]</b> ${link.title.split(',')[0].split('(')[0]}`;
      pill.title = `Inspect ${link.id} on the Atlas Map`;
      pill.addEventListener("click", () => {
        // Pan and highlight on the canvas
        graph.panToNode(link.id);
      });
      internalPillsWrap.appendChild(pill);
    });

    // Populate External Links
    const externalLinksWrap = document.getElementById("card-external-links");
    externalLinksWrap.innerHTML = "";
    (q.externalLinks || []).forEach(ext => {
      const a = document.createElement("a");
      a.className = "external-link-row";
      a.href = ext.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      let icon = "📄";
      if (ext.type === "commercial") icon = "💼";
      else if (ext.type === "tool") icon = "🛠️";
      else if (ext.type === "guideline") icon = "⚖️";
      else if (ext.type === "spec") icon = "📐";

      a.innerHTML = `
        <span class="ext-icon">${icon}</span>
        <span style="flex:1;">${ext.title}</span>
        <span style="font-size:10px; color:var(--text-muted);">↗</span>
      `;
      externalLinksWrap.appendChild(a);
    });

    // Update Mastery Buttons active state
    const btnMastered = document.getElementById("btn-mark-mastered");
    const btnReview = document.getElementById("btn-mark-review");
    btnMastered.classList.toggle("active", isMastered);
    btnReview.classList.toggle("active", isReview);

    // In Coach view mode, automatically focus canvas on current question's primary node
    if (state.viewMode === "coach" && q.primaryNode) {
      graph.panToNode(q.primaryNode);
    }
  }

  function revealCurrentQuestionAnswer() {
    const revealSec = document.getElementById("card-reveal-section");
    revealSec.classList.add("active");
  }

  document.getElementById("btn-card-reveal")?.addEventListener("click", revealCurrentQuestionAnswer);
  
  document.getElementById("btn-card-think")?.addEventListener("click", () => {
    alert("🤔 Self-Check Prompt:\nTake 15 seconds to formulate your answer aloud before revealing! Think: First-principles biology -> Technical tooling -> Clinical or commercial impact.");
  });

  // Mark Mastered & Review Handlers
  document.getElementById("btn-mark-mastered")?.addEventListener("click", () => {
    const q = state.filteredQuestions[state.activeQuestionIndex];
    if (!q) return;

    if (!state.progress.mastered.includes(q.id)) {
      state.progress.mastered.push(q.id);
    }
    state.progress.review = state.progress.review.filter(id => id !== q.id);
    saveProgress();
    renderActiveQuestion();

    // Trigger subtle success indicator and advance
    setTimeout(() => {
      nextQuestion();
    }, 450);
  });

  document.getElementById("btn-mark-review")?.addEventListener("click", () => {
    const q = state.filteredQuestions[state.activeQuestionIndex];
    if (!q) return;

    if (!state.progress.review.includes(q.id)) {
      state.progress.review.push(q.id);
    }
    state.progress.mastered = state.progress.mastered.filter(id => id !== q.id);
    saveProgress();
    renderActiveQuestion();
    setTimeout(() => {
      nextQuestion();
    }, 450);
  });

  // --- Question Matrix Modal (27 Grid) ---
  function openQuestionMatrix() {
    const gridContainer = document.getElementById("matrix-grid-container");
    gridContainer.innerHTML = "";

    interviewData.questions.forEach((q, idx) => {
      const isMastered = state.progress.mastered.includes(q.id);
      const isReview = state.progress.review.includes(q.id);

      const item = document.createElement("div");
      item.className = "matrix-grid-item" + (isMastered ? " mastered" : (isReview ? " review" : ""));

      const pCfg = interviewData.metadata.personas[q.persona];
      const dCfg = interviewData.metadata.difficulties[q.level];

      item.innerHTML = `
        <div class="matrix-item-top">
          <span style="color:${dCfg.color}; font-family:monospace;">${q.id}</span>
          <span>${pCfg.icon}</span>
        </div>
        <div class="matrix-item-desc">${q.question.substring(0, 52)}...</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
          <span style="font-size:9px; color:#60a5fa;">#${q.primaryNode}</span>
          <span style="font-size:9px; font-weight:bold;">${isMastered ? '✅' : (isReview ? '🔁' : '⚪')}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        questionMatrixModal.classList.remove("open");
        // Clear filters to show question
        state.filterLevel = "all";
        state.filterPersona = "all";
        state.filterNode = null;
        state.searchQuery = "";
        applyArenaFilters();
        state.activeQuestionIndex = idx;
        renderActiveQuestion();
        if (state.viewMode === "atlas") {
          setViewMode("coach");
        }
      });

      gridContainer.appendChild(item);
    });

    questionMatrixModal.classList.add("open");
  }

  document.getElementById("btn-arena-matrix")?.addEventListener("click", openQuestionMatrix);
  document.getElementById("btn-close-matrix")?.addEventListener("click", () => {
    questionMatrixModal.classList.remove("open");
  });

  // --- Boss Battles Modal ---
  const BOSS_BATTLES = {
    clia: ["Q02", "Q05", "Q11", "Q12", "Q21"],
    investor: ["Q03", "Q06", "Q09", "Q23", "Q24"],
    cso: ["Q15", "Q16", "Q17", "Q25", "Q27"]
  };

  document.getElementById("btn-arena-boss")?.addEventListener("click", () => {
    bossBattlesModal.classList.add("open");
  });
  document.getElementById("btn-close-boss")?.addEventListener("click", () => {
    bossBattlesModal.classList.remove("open");
  });

  document.querySelectorAll(".boss-battle-card").forEach(card => {
    card.addEventListener("click", () => {
      const battleKey = card.getAttribute("data-battle");
      const qIds = BOSS_BATTLES[battleKey] || [];
      bossBattlesModal.classList.remove("open");

      state.filteredQuestions = interviewData.questions.filter(q => qIds.includes(q.id));
      state.activeQuestionIndex = 0;
      renderActiveQuestion();
      setViewMode("coach");
    });
  });

  // --- External Hubs Directory Modal (Part 3) ---
  function populateExternalHubsModal() {
    const container = document.getElementById("external-hubs-body");
    container.innerHTML = "";

    interviewData.metadata.externalHubs.forEach(cat => {
      const block = document.createElement("div");
      block.className = "hubs-category-block";

      const title = document.createElement("div");
      title.className = "hubs-category-title";
      title.innerHTML = `<span>${cat.icon}</span> <span>${cat.category}</span>`;
      block.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "hubs-cards-grid";

      cat.items.forEach(hub => {
        const a = document.createElement("a");
        a.className = "hub-card";
        a.href = hub.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `
          <div class="hub-card-name">${hub.name} ↗</div>
          <div class="hub-card-desc">${hub.desc}</div>
        `;
        grid.appendChild(a);
      });

      block.appendChild(grid);
      container.appendChild(block);
    });
  }

  document.getElementById("btn-arena-hubs")?.addEventListener("click", () => {
    populateExternalHubsModal();
    externalHubsModal.classList.add("open");
  });
  document.getElementById("btn-close-hubs")?.addEventListener("click", () => {
    externalHubsModal.classList.remove("open");
  });

  // --- Pathfinder Modal & Algorithms ---
  document.getElementById("btn-hud-pathfinder")?.addEventListener("click", openPathfinderModal);
  document.getElementById("btn-sidebar-pathfinder")?.addEventListener("click", openPathfinderModal);
  btnClosePathfinder?.addEventListener("click", closePathfinderModal);

  function openPathfinderModal() {
    pathfinderModal.classList.add("open");
  }

  function closePathfinderModal() {
    pathfinderModal.classList.remove("open");
  }

  function openPathfinderWithStart(startId) {
    if (pathStartSelect) pathStartSelect.value = startId;
    openPathfinderModal();
  }

  // Presets in Sidebar & Modal
  document.querySelectorAll(".sidebar-preset-item[data-start], .preset-pill[data-start]").forEach(pill => {
    pill.addEventListener("click", () => {
      const start = pill.getAttribute("data-start");
      const target = pill.getAttribute("data-target");
      if (start && target) {
        if (pathStartSelect && pathTargetSelect) {
          pathStartSelect.value = start;
          pathTargetSelect.value = target;
          runPathfinderAlgorithm(start, target);
        }
      }
    });
  });

  btnRunPathfinder?.addEventListener("click", () => {
    const start = pathStartSelect.value;
    const target = pathTargetSelect.value;
    runPathfinderAlgorithm(start, target);
  });

  /**
   * Breadth-First Search (BFS) for shortest translational pathway
   */
  function runPathfinderAlgorithm(startId, targetId) {
    if (startId === targetId) {
      alert("Start and Target nodes are the same! Select different nodes.");
      return;
    }

    const adjDirected = new Map();
    const adjUndirected = new Map();

    atlasData.nodes.forEach(n => {
      adjDirected.set(n.id, []);
      adjUndirected.set(n.id, []);
    });

    atlasData.edges.forEach(e => {
      if (adjDirected.has(e.source)) adjDirected.get(e.source).push(e.target);
      if (adjUndirected.has(e.source)) adjUndirected.get(e.source).push(e.target);
      if (adjUndirected.has(e.target)) adjUndirected.get(e.target).push(e.source);
    });

    function bfs(adj) {
      const queue = [[startId]];
      const visited = new Set([startId]);

      while (queue.length > 0) {
        const path = queue.shift();
        const curr = path[path.length - 1];
        if (curr === targetId) return path;

        const neighbors = adj.get(curr) || [];
        for (const nxt of neighbors) {
          if (!visited.has(nxt)) {
            visited.add(nxt);
            queue.push([...path, nxt]);
          }
        }
      }
      return null;
    }

    let path = bfs(adjDirected);
    let pathType = "Direct Forward Translational Flow";

    if (!path) {
      path = bfs(adjUndirected);
      pathType = "Cross-Domain Translational Network";
    }

    if (!path) {
      pathResultBox.classList.add("active");
      pathStatsSummary.textContent = "No pathway found connecting these concepts.";
      pathStepsFlow.innerHTML = "";
      return;
    }

    pathResultBox.classList.add("active");
    pathStatsSummary.innerHTML = `
      <span>Found <b>${path.length} steps</b> spanning <b>${new Set(path.map(id => atlasData.nodes.find(n => n.id === id)?.layer)).size} Layers</b></span>
      <span style="color:#f59e0b;font-weight:600;">${pathType}</span>
    `;

    pathStepsFlow.innerHTML = "";
    path.forEach((nodeId, idx) => {
      const node = atlasData.nodes.find(n => n.id === nodeId);
      const pill = document.createElement("div");
      pill.className = "step-node-pill";
      pill.style.borderColor = node.layerColor;
      pill.innerHTML = `
        <span style="width:7px;height:7px;border-radius:50%;background:${node.layerColor}"></span>
        <span><b>${node.id}</b>: ${node.title.split(",")[0].split("(")[0]}</span>
      `;
      pathStepsFlow.appendChild(pill);

      if (idx < path.length - 1) {
        const arrow = document.createElement("span");
        arrow.className = "step-arrow";
        arrow.textContent = "➔";
        pathStepsFlow.appendChild(arrow);
      }
    });

    // Highlight on graph canvas
    graph.highlightPath(path);

    setTimeout(() => {
      closePathfinderModal();
      collapseSidebar();
    }, 1200);
  }

  // --- Markdown & KaTeX Helpers ---
  function renderMarkdown(mdText) {
    if (window.marked && typeof window.marked.parse === "function") {
      return window.marked.parse(mdText);
    }
    return mdText
      .replace(/^### (.*$)/gim, '<h4 style="color:#38bdf8;margin-top:10px;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="color:#60a5fa;margin-top:12px;">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 style="color:#93c5fd;margin-top:14px;">$1</h2>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n$/gim, '<br />');
  }

  function renderMath(formula) {
    if (window.katex && typeof window.katex.renderToString === "function") {
      try {
        return window.katex.renderToString(formula, { displayMode: true, throwOnError: false });
      } catch (e) {
        return `<code>${formula}</code>`;
      }
    }
    return `<code>${formula}</code>`;
  }

  function renderMathInElementIfAvailable(element) {
    if (window.renderMathInElement && element) {
      window.renderMathInElement(element, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  }

  // --- Initial Render ---
  updateGamificationUI();
  renderActiveQuestion();
});
