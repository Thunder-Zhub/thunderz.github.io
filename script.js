(function () {
  "use strict";

  const copyBtn = document.getElementById("copyIpBtn");
  const toast = document.getElementById("toast");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const statusEl = document.getElementById("serverStatus");
  const statusText = document.getElementById("statusText");
  const playersCount = document.getElementById("playersCount");
  const logoImg = document.getElementById("logoImg");
  const SERVER_IP = copyBtn.dataset.ip;
  const STATUS_URL = "https://api.mcstatus.io/v2/status/java/" + encodeURIComponent(SERVER_IP);
  const REFRESH_MS = 60000;
  let toastTimer;

  /* ---------- Copy server IP ---------- */
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2000);
  }

  function fallbackCopy(text) {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(input);
    return ok;
  }

  async function copyIp() {
    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(SERVER_IP);
        ok = true;
      } catch (err) {
        ok = fallbackCopy(SERVER_IP);
      }
    } else {
      ok = fallbackCopy(SERVER_IP);
    }
    showToast(ok ? "Copied!" : "Couldn't copy. Server IP: " + SERVER_IP);
  }

  copyBtn.addEventListener("click", copyIp);

  /* ---------- Live server status (mcstatus.io) ---------- */
  function setOnline(online, max) {
    statusEl.dataset.state = "online";
    statusText.textContent = "Online";
    playersCount.textContent = online + " / " + max;
  }

  function setOffline() {
    statusEl.dataset.state = "offline";
    statusText.textContent = "Server Offline";
  }

  async function updateStatus() {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 8000);

    try {
      const res = await fetch(STATUS_URL, { signal: controller.signal, cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      if (data && data.online) {
        const players = data.players || {};
        const online = Number.isFinite(players.online) ? players.online : 0;
        const max = Number.isFinite(players.max) ? players.max : "?";
        setOnline(online, max);
      } else {
        setOffline();
      }
    } catch (err) {
      // Server is down, or the status API couldn't be reached (network error, timeout, bad response)
      setOffline();
    } finally {
      clearTimeout(timer);
    }
  }

  updateStatus();
  setInterval(updateStatus, REFRESH_MS);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) updateStatus();
  });

  /* ---------- Logo fallback ---------- */
  function hideLogo() {
    logoImg.classList.add("is-hidden");
  }
  logoImg.addEventListener("error", hideLogo);
  if (logoImg.complete && logoImg.naturalWidth === 0) hideLogo();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }

  navToggle.addEventListener("click", function () {
    setMenu(!navLinks.classList.contains("open"));
  });

  navLinks.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- Glass spotlight (follows the pointer) ---------- */
  document.querySelectorAll(".glass").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();