/**
 * graph_engine.js
 * Precision Genomics Knowledge Graph Canvas Engine
 * Supports:
 * - 10-Layer Pipeline Flow Layout (Biological to Clinical translational progression)
 * - Organic Force-Directed Physics Layout
 * - Concentric Hierarchical Layout
 * - Smooth Zoom, Pan, Dragging, Particle Flow, KaTeX integration, and Highlighting
 */

class GenomicsGraphEngine {
  constructor(canvasContainerId, atlasData, options = {}) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) throw new Error("Canvas container not found: " + canvasContainerId);

    this.atlasData = atlasData;
    this.nodes = [];
    this.edges = [];
    this.nodeMap = new Map();
    this.options = Object.assign({
      onNodeSelect: () => {},
      onNodeHover: () => {},
      onCanvasClick: () => {}
    }, options);

    // Viewport transform
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;

    // Interaction states
    this.isDragging = false;
    this.draggedNode = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.hoveredNode = null;
    this.selectedNodeId = null;
    this.activeFilterLayer = null; // null = all layers
    this.pathfinderPath = null; // array of node IDs
    this.currentLayout = "pipeline"; // "pipeline", "force", "concentric"
    this.showLabels = true;
    this.animateFlow = true;
    this.particles = [];

    // Setup Canvas
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);

    this.initData();
    this.resizeCanvas();
    this.setupEvents();
    this.applyLayout(this.currentLayout);

    // Animation loop
    this.animFrameId = requestAnimationFrame(this.renderLoop.bind(this));
  }

  initData() {
    this.nodeMap.clear();
    this.nodes = this.atlasData.nodes.map(n => {
      const nodeObj = {
        ...n,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 20,
        baseColor: n.layerColor || "#3b82f6",
        highlighted: false,
        highlightType: null, // "selected", "upstream", "downstream", "path"
        dimmed: false,
        pathStep: null
      };
      this.nodeMap.set(n.id, nodeObj);
      return nodeObj;
    });

    this.edges = this.atlasData.edges.map(e => ({
      ...e,
      sourceNode: this.nodeMap.get(e.source),
      targetNode: this.nodeMap.get(e.target),
      highlighted: false,
      highlightType: null,
      dimmed: false
    })).filter(e => e.sourceNode && e.targetNode);

    // Initialize edge particles for flow animation
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 60; i++) {
      if (this.edges.length === 0) break;
      const randomEdge = this.edges[Math.floor(Math.random() * this.edges.length)];
      this.particles.push({
        edge: randomEdge,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.006,
        size: 2 + Math.random() * 2
      });
    }
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  applyLayout(layoutName) {
    this.currentLayout = layoutName;
    const paddingX = 120;
    const paddingY = 90;
    const availWidth = Math.max(1600, this.width - paddingX * 2);
    const availHeight = Math.max(750, this.height - paddingY * 2);

    if (layoutName === "pipeline") {
      // 10-Layer Pipeline Mode: Column per layer (1 to 10)
      const totalLayers = 10;
      const colWidth = availWidth / (totalLayers - 1);

      // Group nodes by layer
      const layerGroups = {};
      for (let l = 1; l <= 10; l++) layerGroups[l] = [];
      this.nodes.forEach(n => {
        if (!layerGroups[n.layer]) layerGroups[n.layer] = [];
        layerGroups[n.layer].push(n);
      });

      for (let l = 1; l <= 10; l++) {
        const group = layerGroups[l];
        const colX = paddingX + (l - 1) * colWidth;
        const count = group.length;
        const rowHeight = availHeight / (count + 1);

        group.forEach((node, idx) => {
          node.x = colX;
          node.y = paddingY + (idx + 1) * rowHeight;
          node.vx = 0;
          node.vy = 0;
        });
      }
    } else if (layoutName === "concentric") {
      // Concentric rings: Layer 1 at inner center, Layer 10 at outer
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const maxRadius = Math.min(availWidth, availHeight) * 0.45;

      const layerGroups = {};
      this.nodes.forEach(n => {
        if (!layerGroups[n.layer]) layerGroups[n.layer] = [];
        layerGroups[n.layer].push(n);
      });

      for (let l = 1; l <= 10; l++) {
        const group = layerGroups[l] || [];
        const ringRadius = 70 + (l - 1) * ((maxRadius - 70) / 9);
        const count = group.length;
        group.forEach((node, idx) => {
          const angle = (idx / count) * Math.PI * 2 + (l * 0.2);
          node.x = centerX + Math.cos(angle) * ringRadius;
          node.y = centerY + Math.sin(angle) * ringRadius;
          node.vx = 0;
          node.vy = 0;
        });
      }
    } else if (layoutName === "force") {
      // Force-directed initial positions: disperse with random jitter around layer centers
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      this.nodes.forEach(n => {
        const angle = (n.layer / 10) * Math.PI * 2;
        const dist = 120 + n.layer * 25 + (Math.random() - 0.5) * 60;
        n.x = centerX + Math.cos(angle) * dist;
        n.y = centerY + Math.sin(angle) * dist;
        n.vx = (Math.random() - 0.5) * 2;
        n.vy = (Math.random() - 0.5) * 2;
      });
    }

    this.fitToScreen();
  }

  fitToScreen() {
    if (this.nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    this.nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const graphWidth = maxX - minX + 160;
    const graphHeight = maxY - minY + 160;
    const scaleX = this.width / graphWidth;
    const scaleY = this.height / graphHeight;
    this.zoom = Math.min(scaleX, scaleY, 1.2) * 0.9;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.panX = this.width / 2 - centerX * this.zoom;
    this.panY = this.height / 2 - centerY * this.zoom;
  }

  panToNode(nodeId) {
    const node = this.nodeMap.get(nodeId);
    if (!node) return;
    this.zoom = 1.35;
    this.panX = this.width / 2 - node.x * this.zoom;
    this.panY = this.height / 2 - node.y * this.zoom;
    this.selectNode(nodeId);
  }

  selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    this.pathfinderPath = null; // Clear pathfinder if single node selected

    if (!nodeId) {
      // Clear selection
      this.nodes.forEach(n => {
        n.highlighted = false;
        n.highlightType = null;
        n.dimmed = false;
        n.pathStep = null;
      });
      this.edges.forEach(e => {
        e.highlighted = false;
        e.highlightType = null;
        e.dimmed = false;
      });
      this.options.onCanvasClick();
      return;
    }

    const targetNode = this.nodeMap.get(nodeId);
    if (!targetNode) return;

    const upstreamIds = new Set(targetNode.upstream || []);
    const downstreamIds = new Set(targetNode.downstream || []);

    this.nodes.forEach(n => {
      if (n.id === nodeId) {
        n.highlighted = true;
        n.highlightType = "selected";
        n.dimmed = false;
      } else if (upstreamIds.has(n.id)) {
        n.highlighted = true;
        n.highlightType = "upstream";
        n.dimmed = false;
      } else if (downstreamIds.has(n.id)) {
        n.highlighted = true;
        n.highlightType = "downstream";
        n.dimmed = false;
      } else {
        n.highlighted = false;
        n.highlightType = null;
        n.dimmed = true;
      }
      n.pathStep = null;
    });

    this.edges.forEach(e => {
      if (e.target === nodeId && upstreamIds.has(e.source)) {
        e.highlighted = true;
        e.highlightType = "upstream";
        e.dimmed = false;
      } else if (e.source === nodeId && downstreamIds.has(e.target)) {
        e.highlighted = true;
        e.highlightType = "downstream";
        e.dimmed = false;
      } else {
        e.highlighted = false;
        e.highlightType = null;
        e.dimmed = true;
      }
    });

    this.options.onNodeSelect(targetNode);
  }

  highlightPath(pathNodeIds) {
    if (!pathNodeIds || pathNodeIds.length === 0) return;
    this.pathfinderPath = pathNodeIds;
    this.selectedNodeId = null;

    const pathSet = new Set(pathNodeIds);
    const pathEdgesSet = new Set();
    for (let i = 0; i < pathNodeIds.length - 1; i++) {
      pathEdgesSet.add(`${pathNodeIds[i]}->${pathNodeIds[i+1]}`);
      pathEdgesSet.add(`${pathNodeIds[i+1]}->${pathNodeIds[i]}`); // bidirectional match
    }

    this.nodes.forEach(n => {
      const idx = pathNodeIds.indexOf(n.id);
      if (idx !== -1) {
        n.highlighted = true;
        n.highlightType = "path";
        n.dimmed = false;
        n.pathStep = idx + 1;
      } else {
        n.highlighted = false;
        n.highlightType = null;
        n.dimmed = true;
        n.pathStep = null;
      }
    });

    this.edges.forEach(e => {
      const key1 = `${e.source}->${e.target}`;
      const key2 = `${e.target}->${e.source}`;
      if (pathEdgesSet.has(key1) || pathEdgesSet.has(key2)) {
        e.highlighted = true;
        e.highlightType = "path";
        e.dimmed = false;
      } else {
        e.highlighted = false;
        e.highlightType = null;
        e.dimmed = true;
      }
    });

    // Zoom/pan to encompass the path
    const pathNodes = pathNodeIds.map(id => this.nodeMap.get(id)).filter(Boolean);
    if (pathNodes.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      pathNodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      });
      const pw = Math.max(200, maxX - minX + 240);
      const ph = Math.max(200, maxY - minY + 240);
      this.zoom = Math.min(this.width / pw, this.height / ph, 1.4);
      this.panX = this.width / 2 - ((minX + maxX) / 2) * this.zoom;
      this.panY = this.height / 2 - ((minY + maxY) / 2) * this.zoom;
    }
  }

  filterByLayer(layerNum) {
    this.activeFilterLayer = layerNum;
    this.selectedNodeId = null;
    this.pathfinderPath = null;

    if (layerNum === null) {
      // Clear filter
      this.nodes.forEach(n => {
        n.highlighted = false;
        n.highlightType = null;
        n.dimmed = false;
        n.pathStep = null;
      });
      this.edges.forEach(e => {
        e.highlighted = false;
        e.highlightType = null;
        e.dimmed = false;
      });
      return;
    }

    this.nodes.forEach(n => {
      if (n.layer === layerNum) {
        n.highlighted = true;
        n.highlightType = "selected";
        n.dimmed = false;
      } else {
        n.highlighted = false;
        n.highlightType = null;
        n.dimmed = true;
      }
      n.pathStep = null;
    });

    this.edges.forEach(e => {
      if (e.sourceNode.layer === layerNum && e.targetNode.layer === layerNum) {
        e.highlighted = true;
        e.highlightType = "selected";
        e.dimmed = false;
      } else {
        e.highlighted = false;
        e.highlightType = null;
        e.dimmed = true;
      }
    });
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.panX) / this.zoom,
      y: (sy - this.panY) / this.zoom
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.zoom + this.panX,
      y: wy * this.zoom + this.panY
    };
  }

  findNodeAt(screenX, screenY) {
    const world = this.screenToWorld(screenX, screenY);
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dx = world.x - node.x;
      const dy = world.y - node.y;
      const hitRadius = (node.radius + 6);
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  }

  setupEvents() {
    window.addEventListener("resize", () => {
      this.resizeCanvas();
    });

    this.canvas.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hitNode = this.findNodeAt(mouseX, mouseY);
      if (hitNode) {
        this.draggedNode = hitNode;
        this.isDragging = false;
      } else {
        this.draggedNode = null;
        this.isDragging = true;
      }

      this.dragStartX = mouseX;
      this.dragStartY = mouseY;
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (this.draggedNode) {
        const worldPos = this.screenToWorld(mouseX, mouseY);
        this.draggedNode.x = worldPos.x;
        this.draggedNode.y = worldPos.y;
      } else if (this.isDragging) {
        const dx = mouseX - this.lastMouseX;
        const dy = mouseY - this.lastMouseY;
        this.panX += dx;
        this.panY += dy;
      } else {
        // Hover test
        const hit = this.findNodeAt(mouseX, mouseY);
        if (hit !== this.hoveredNode) {
          this.hoveredNode = hit;
          this.canvas.style.cursor = hit ? "pointer" : "default";
          this.options.onNodeHover(hit, e.clientX, e.clientY);
        }
      }

      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
    });

    window.addEventListener("mouseup", (e) => {
      if (this.draggedNode) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const dist = Math.hypot(mouseX - this.dragStartX, mouseY - this.dragStartY);
        if (dist < 5) {
          // It was a click
          this.selectNode(this.draggedNode.id);
        }
        this.draggedNode = null;
      } else if (this.isDragging) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const dist = Math.hypot(mouseX - this.dragStartX, mouseY - this.dragStartY);
        if (dist < 4) {
          this.selectNode(null);
        }
        this.isDragging = false;
      }
    });

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.max(0.2, Math.min(4.0, this.zoom * zoomFactor));

      // Zoom towards mouse pointer
      this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;
    }, { passive: false });

    // Mobile touch events: single-finger pan/drag, tap to select, two-finger pinch-to-zoom
    this.canvas.style.touchAction = "none";
    let touchStartDist = 0;
    let touchStartZoom = 1;
    let touchMidpoint = { x: 0, y: 0 };
    let isTouchPanning = false;
    let touchMoved = false;

    this.canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        const hit = this.findNodeAt(touchX, touchY);
        if (hit) {
          this.draggedNode = hit;
          isTouchPanning = false;
        } else {
          this.draggedNode = null;
          isTouchPanning = true;
        }
        this.dragStartX = touchX;
        this.dragStartY = touchY;
        this.lastMouseX = touchX;
        this.lastMouseY = touchY;
        touchMoved = false;
      } else if (e.touches.length === 2) {
        this.draggedNode = null;
        isTouchPanning = false;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        touchStartZoom = this.zoom;
        const rect = this.canvas.getBoundingClientRect();
        touchMidpoint = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top
        };
      }
    }, { passive: true });

    this.canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        if (Math.hypot(touchX - this.dragStartX, touchY - this.dragStartY) > 6) {
          touchMoved = true;
        }

        if (this.draggedNode) {
          const worldPos = this.screenToWorld(touchX, touchY);
          this.draggedNode.x = worldPos.x;
          this.draggedNode.y = worldPos.y;
        } else if (isTouchPanning) {
          const dx = touchX - this.lastMouseX;
          const dy = touchY - this.lastMouseY;
          this.panX += dx;
          this.panY += dy;
        }
        this.lastMouseX = touchX;
        this.lastMouseY = touchY;
        e.preventDefault();
      } else if (e.touches.length === 2) {
        touchMoved = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (touchStartDist > 0) {
          const factor = currentDist / touchStartDist;
          const newZoom = Math.max(0.2, Math.min(4.0, touchStartZoom * factor));
          this.panX = touchMidpoint.x - (touchMidpoint.x - this.panX) * (newZoom / this.zoom);
          this.panY = touchMidpoint.y - (touchMidpoint.y - this.panY) * (newZoom / this.zoom);
          this.zoom = newZoom;
        }
        e.preventDefault();
      }
    }, { passive: false });

    this.canvas.addEventListener("touchend", (e) => {
      if (!touchMoved && e.touches.length === 0) {
        // Single tap without drag
        const hit = this.draggedNode || this.findNodeAt(this.dragStartX, this.dragStartY);
        if (hit) {
          this.selectNode(hit.id);
        } else {
          this.selectNode(null);
        }
      }
      if (e.touches.length === 0) {
        this.draggedNode = null;
        isTouchPanning = false;
        touchStartDist = 0;
      }
    });
  }

  updatePhysics() {
    if (this.currentLayout !== "force") return;

    // Node repulsion
    const kRepel = 2400;
    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);
        if (dist < 500) {
          const force = kRepel / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (n1 !== this.draggedNode) { n1.vx -= fx; n1.vy -= fy; }
          if (n2 !== this.draggedNode) { n2.vx += fx; n2.vy += fy; }
        }
      }
    }

    // Edge springs
    const springLength = 120;
    const kSpring = 0.04;
    this.edges.forEach(e => {
      const n1 = e.sourceNode;
      const n2 = e.targetNode;
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - springLength) * kSpring;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (n1 !== this.draggedNode) { n1.vx += fx; n1.vy += fy; }
      if (n2 !== this.draggedNode) { n2.vx -= fx; n2.vy -= fy; }
    });

    // Center gravity
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    this.nodes.forEach(n => {
      if (n === this.draggedNode) return;
      n.vx += (centerX - n.x) * 0.001;
      n.vy += (centerY - n.y) * 0.001;
      n.vx *= 0.85; // damping
      n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
    });
  }

  renderLoop() {
    this.updatePhysics();
    this.render();
    this.animFrameId = requestAnimationFrame(this.renderLoop.bind(this));
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Draw Pipeline Layer Columns / Guides in Pipeline mode
    if (this.currentLayout === "pipeline") {
      this.renderPipelineGuides(ctx);
    }

    // Render Edges
    this.renderEdges(ctx);

    // Render Animated Edge Particles
    if (this.animateFlow) {
      this.renderParticles(ctx);
    }

    // Render Nodes
    this.renderNodes(ctx);

    ctx.restore();
  }

  renderPipelineGuides(ctx) {
    const availWidth = Math.max(1600, this.width - 240);
    const colWidth = availWidth / 9;
    const paddingX = 120;

    for (let l = 1; l <= 10; l++) {
      const colX = paddingX + (l - 1) * colWidth;
      const layerCfg = this.atlasData.metadata.layers[l];
      if (!layerCfg) continue;

      // Vertical guide line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(75, 85, 99, 0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.moveTo(colX, 30);
      ctx.lineTo(colX, 850);
      ctx.stroke();
      ctx.setLineDash([]);

      // Layer header label
      ctx.fillStyle = layerCfg.color;
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${layerCfg.badge}`, colX, 45);

      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.font = "9px -apple-system, sans-serif";
      const shortName = layerCfg.name.length > 20 ? layerCfg.name.substring(0, 18) + "..." : layerCfg.name;
      ctx.fillText(shortName, colX, 60);
    }
  }

  renderEdges(ctx) {
    this.edges.forEach(e => {
      const n1 = e.sourceNode;
      const n2 = e.targetNode;
      let strokeColor = "rgba(100, 116, 139, 0.22)";
      let lineWidth = 1.2;

      if (e.dimmed) {
        strokeColor = "rgba(51, 65, 85, 0.08)";
        lineWidth = 0.8;
      } else if (e.highlighted) {
        if (e.highlightType === "upstream") {
          strokeColor = "#06b6d4"; // Cyan
          lineWidth = 2.8;
        } else if (e.highlightType === "downstream") {
          strokeColor = "#10b981"; // Emerald
          lineWidth = 2.8;
        } else if (e.highlightType === "path") {
          strokeColor = "#f59e0b"; // Gold
          lineWidth = 3.6;
        } else {
          strokeColor = "#60a5fa";
          lineWidth = 2.2;
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      // Draw smooth Bezier curve
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const cx1 = n1.x + dx * 0.5;
      const cy1 = n1.y;
      const cx2 = n1.x + dx * 0.5;
      const cy2 = n2.y;

      ctx.moveTo(n1.x, n1.y);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, n2.x, n2.y);
      ctx.stroke();

      // Render directional arrow if highlighted
      if (e.highlighted) {
        this.renderArrow(ctx, n1.x, n1.y, n2.x, n2.y, strokeColor);
      }
    });
  }

  renderArrow(ctx, fromX, fromY, toX, toY, color) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    // Position arrow near target outside node radius
    const arrowDist = 26;
    const ax = toX - Math.cos(angle) * arrowDist;
    const ay = toY - Math.sin(angle) * arrowDist;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1) p.progress = 0;

      const n1 = p.edge.sourceNode;
      const n2 = p.edge.targetNode;
      if (!n1 || !n2) return;

      const t = p.progress;
      const dx = n2.x - n1.x;
      const cx1 = n1.x + dx * 0.5;
      const cy1 = n1.y;
      const cx2 = n1.x + dx * 0.5;
      const cy2 = n2.y;

      // Cubic Bezier interpolation
      const u = 1 - t;
      const px = u*u*u*n1.x + 3*u*u*t*cx1 + 3*u*t*t*cx2 + t*t*t*n2.x;
      const py = u*u*u*n1.y + 3*u*u*t*cy1 + 3*u*t*t*cy2 + t*t*t*n2.y;

      let particleColor = "rgba(56, 189, 248, 0.4)";
      if (p.edge.highlighted) {
        if (p.edge.highlightType === "path") particleColor = "#fbbf24";
        else if (p.edge.highlightType === "upstream") particleColor = "#22d3ee";
        else if (p.edge.highlightType === "downstream") particleColor = "#34d399";
      }

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = particleColor;
      ctx.shadowColor = particleColor;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  renderNodes(ctx) {
    this.nodes.forEach(node => {
      const isSelected = node.id === this.selectedNodeId;
      const isHovered = node === this.hoveredNode;
      let radius = node.radius;
      let fillColor = node.baseColor;
      let alpha = 1.0;

      if (node.dimmed) {
        alpha = 0.15;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      // Glow halo ring for selected / highlighted / path nodes
      if (node.highlighted || isHovered) {
        ctx.beginPath();
        let glowColor = node.baseColor;
        let glowSize = 14;

        if (node.highlightType === "selected") {
          glowColor = "#38bdf8";
          glowSize = 22;
        } else if (node.highlightType === "upstream") {
          glowColor = "#06b6d4";
          glowSize = 16;
        } else if (node.highlightType === "downstream") {
          glowColor = "#10b981";
          glowSize = 16;
        } else if (node.highlightType === "path") {
          glowColor = "#f59e0b";
          glowSize = 20;
        }

        ctx.arc(node.x, node.y, radius + glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = alpha * 0.35;
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
      }

      // Outer node circle border
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#111827";
      ctx.fill();
      ctx.lineWidth = isSelected ? 3.5 : (node.highlighted ? 2.5 : 1.8);
      ctx.strokeStyle = isSelected ? "#fff" : fillColor;
      ctx.stroke();

      // Inner color circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius - 4, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Node ID text inside dot
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.id, node.x, node.y);

      // Pathfinder step badge (1, 2, 3...)
      if (node.pathStep) {
        const badgeX = node.x + 14;
        const badgeY = node.y - 14;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#000";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText(node.pathStep, badgeX, badgeY);
      }

      // Labels below node
      if (this.showLabels) {
        ctx.fillStyle = node.highlighted || isHovered ? "#ffffff" : "#cbd5e1";
        ctx.font = (node.highlighted || isHovered) ? "600 11px -apple-system, sans-serif" : "500 10px -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        // Shorten title if long
        let displayTitle = node.title;
        if (displayTitle.length > 24) {
          displayTitle = displayTitle.substring(0, 22) + "...";
        }
        ctx.fillText(displayTitle, node.x, node.y + radius + 6);
      }

      ctx.restore();
    });
  }
}

window.GenomicsGraphEngine = GenomicsGraphEngine;

