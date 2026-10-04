(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.querySelector(".header");
  const progress = document.querySelector(".progress span");
  const sections = [...document.querySelectorAll("main section[id]")];
  const links = [...document.querySelectorAll(".nav-links a")];

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;

    let current = "";
    sections.forEach((sec) => {
      if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
    });
    links.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === `#${current}`);
    });
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const menuBtn = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");

  const closeMenu = () => {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "Menu";
  };

  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
  });

  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  const markCopied = (action) => {
    const previous = action.textContent;
    action.textContent = "Copied";
    setTimeout(() => {
      action.textContent = previous === "Copied" ? "Copy" : "Copy";
    }, 1600);
  };

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.dataset.copy;
      const action = btn.querySelector(".ca-action");
      try {
        await navigator.clipboard.writeText(value);
        markCopied(action);
      } catch {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        action.textContent = ok ? "Copied" : "Select";
        if (ok) setTimeout(() => { action.textContent = "Copy"; }, 1600);
      }
    });
  });

  const cycle = document.getElementById("cycle");
  const phrases = [
    "Artificial Intelligence",
    "The owl is the AI",
    "The owl = the robot",
    "Superintelligence"
  ];
  let phraseIndex = 0;

  if (cycle && !reduce) {
    window.setInterval(() => {
      cycle.classList.add("out");
      window.setTimeout(() => {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        cycle.textContent = phrases[phraseIndex];
        cycle.classList.remove("out");
      }, 280);
    }, 2600);
  }

  if (!reduce && "IntersectionObserver" in window) {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach((el) => el.classList.add("animate"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    reveals.forEach((el) => observer.observe(el));
  }

  const wrap = document.querySelector(".portrait-wrap");
  if (wrap && !reduce && window.matchMedia("(pointer:fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 18;
      const dy = (e.clientY / window.innerHeight - 0.5) * 14;
      wrap.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    }, { passive: true });
  }

  const canvas = document.getElementById("field");
  if (!canvas || reduce) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let nodes = [];
  const mouse = { x: -9999, y: -9999 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let running = true;

  const spawn = () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.32,
    vy: (Math.random() - 0.5) * 0.32,
    r: Math.random() * 1.5 + 0.5
  });

  const layout = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((width * height) / 19000);
    nodes = Array.from({ length: Math.min(100, Math.max(36, count)) }, spawn);
  };

  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  const frame = () => {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    for (const node of nodes) {
      const dx = mouse.x - node.x;
      const dy = mouse.y - node.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 200 && dist > 0) {
        node.vx += (dx / dist) * 0.012;
        node.vy += (dy / dist) * 0.012;
      }
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
      const speed = Math.hypot(node.vx, node.vy);
      if (speed > 0.85) {
        node.vx = (node.vx / speed) * 0.85;
        node.vy = (node.vy / speed) * 0.85;
      }
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.strokeStyle = `rgba(0, 200, 5, ${((1 - d / 130) * 0.32).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const node of nodes) {
      ctx.fillStyle = "rgba(0, 200, 5, 0.9)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }

    window.requestAnimationFrame(frame);
  };

  layout();
  window.addEventListener("resize", layout);
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) window.requestAnimationFrame(frame);
  });
  window.requestAnimationFrame(frame);
})();
