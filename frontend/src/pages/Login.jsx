import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchSignupMeta } from "../api";
import CustomDropdown from "../components/CustomDropdown";
import {
  IconAlert,
  IconCheckCircle,
  IconEye,
  IconEyeOff,
  IconInfo,
  IconKey,
  IconLock,
  IconLogin,
  IconMail,
  IconShieldCheck,
  IconUser,
  IconUserPlus,
} from "../components/AuthIcons";

// Particle Canvas Background
function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    let animationId;
    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          baseX: Math.random() * canvas.width,
          baseY: Math.random() * canvas.height,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((p, i) => {
        // Mouse repulsion
        let dx = mouse.x - p.x;
        let dy = mouse.y - p.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          const directionX = forceDirectionX * force * 3;
          const directionY = forceDirectionY * force * 3;
          p.x -= directionX;
          p.y -= directionY;
        } else {
          if (p.x !== p.baseX) {
            let dx = p.baseX - p.x;
            p.x += dx * 0.02;
          }
          if (p.y !== p.baseY) {
            let dy = p.baseY - p.y;
            p.y += dy * 0.02;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
        ctx.fill();
        
        // Glow effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, "rgba(56, 189, 248, 0.24)");
        gradient.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.25 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      // Mouse spotlight glow
      if (mouse.x && mouse.y) {
        const spotlight = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 300
        );
        spotlight.addColorStop(0, "rgba(56, 189, 248, 0.12)");
        spotlight.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = spotlight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(drawParticles);
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    resize();
    createParticles();
    drawParticles();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

// Drifting Orbs
function DriftingOrbs() {
  return (
    <div className="drifting-orbs">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

// Dot Grid Overlay
function DotGrid() {
  return <div className="dot-grid-overlay" />;
}

// Logo Component
function Logo() {
  return (
    <div className="green-logo">
      <svg width="42" height="48" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shieldGradientBlue" x1="5" y1="3" x2="27" y2="33" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path
          d="M16 2L28 7V17.5C28 25 23.6 30.6 16 34C8.4 30.6 4 25 4 17.5V7L16 2Z"
          fill="url(#shieldGradientBlue)"
          stroke="rgba(56, 189, 248, 0.55)"
          strokeWidth="1.2"
        />
        <path d="M10 10.5V25.5L20.8 22.6V13.4L10 10.5Z" stroke="#D7EAFE" strokeWidth="1.4" />
        <path d="M10 25.5L20.8 13.4" stroke="#D7EAFE" strokeWidth="1.2" />
      </svg>
      <span className="logo-text">DocAgent</span>
    </div>
  );
}

function getPasswordStrengthError(password) {
  const value = String(password || "");
  const checks = [
    value.length >= 8,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  if (checks.every(Boolean)) return "";
  return "Use 8+ chars with uppercase, lowercase, number, and special character.";
}

function getPasswordStrengthData(password) {
  const value = String(password || "");
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (!value) return { score: 0, label: "None" };
  if (score <= 2) return { score: 1, label: "Weak" };
  if (score <= 3) return { score: 2, label: "Fair" };
  if (score <= 4) return { score: 3, label: "Good" };
  return { score: 4, label: "Strong" };
}

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isUsernameLike(value) {
  return /^[A-Za-z0-9_]{3,32}$/.test(String(value || "").trim());
}

// Password Strength Bar
function PasswordStrengthBar({ score, label }) {
  const active = Math.max(0, Math.min(4, Number(score) || 0));
  const segments = [
    { level: 1, color: "#EF4444" },
    { level: 2, color: "#84CC16" },
    { level: 3, color: "#22C55E" },
    { level: 4, color: "#4ADE80" },
  ];

  return (
    <div className="green-strength">
      <div className="green-strength-head">
        <span>Password Strength</span>
        <strong className={`green-strength-label level-${active}`}>{label}</strong>
      </div>
      <div className="green-strength-track" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={active}>
        {segments.map((seg) => (
          <span 
            key={seg.level} 
            className={`green-strength-segment ${active >= seg.level ? "is-on" : ""}`}
            style={{ "--seg-color": seg.color }}
          />
        ))}
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleUi, setRoleUi] = useState("user");
  const [role, setRole] = useState("user");
  const [newAdminKey, setNewAdminKey] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewAdminKey, setShowNewAdminKey] = useState(false);
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [capsOn, setCapsOn] = useState(false);
  const [fieldFeedback, setFieldFeedback] = useState({});
  const [signupMeta, setSignupMeta] = useState({
    admin_exists: false,
    admin_key_initialized: false,
  });

  const cardRef = useRef(null);
  const loginTabId = "auth-tab-login";
  const registerTabId = "auth-tab-register";
  const panelId = mode === "login" ? "auth-panel-login" : "auth-panel-register";

  useEffect(() => {
    async function loadSignupMeta() {
      try {
        const data = await fetchSignupMeta();
        setSignupMeta({
          admin_exists: Boolean(data?.admin_exists),
          admin_key_initialized: Boolean(data?.admin_key_initialized),
        });
      } catch {
        // Keep defaults when API is unavailable.
      }
    }
    if (mode === "register") loadSignupMeta();
  }, [mode]);

  useEffect(() => {
    setError("");
    setInfo("");
    setFieldFeedback({});
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
    setShowNewAdminKey(false);
  }, [mode]);

  useEffect(() => {
    if (!error) return;
    const node = cardRef.current;
    if (!node) return;
    node.classList.remove("green-shake");
    void node.offsetWidth;
    node.classList.add("green-shake");
  }, [error]);

  const strength = useMemo(() => getPasswordStrengthData(password), [password]);

  function validateForm() {
    if (!password.trim()) return "Password is required.";
    if (mode === "login" && !identifier.trim()) return "Email or username is required.";
    if (mode === "register" && !username.trim()) return "Username is required.";
    if (mode === "register" && !email.trim()) return "Email is required.";
    if (mode === "register" && !isEmailLike(email)) return "Enter a valid email address.";
    if (mode === "register" && !isUsernameLike(username)) return "Username must be 3-32 chars (letters, numbers, underscore).";
    if (mode === "register" && password !== confirmPassword) return "Password and Confirm Password do not match.";
    if (mode === "register" && role === "admin" && signupMeta.admin_exists) {
      return "Admin self-registration is disabled. Super admin must promote users.";
    }
    if (mode === "register" && role === "admin" && !signupMeta.admin_exists && !newAdminKey.trim()) {
      return "As first admin, you must create an admin creation key.";
    }
    if (mode === "register") {
      return getPasswordStrengthError(password);
    }
    return "";
  }

  function setFieldState(name, valid, message) {
    setFieldFeedback((prev) => ({ ...prev, [name]: { valid, message } }));
  }

  function onBlurField(name, value) {
    if (name === "email") {
      if (!value.trim()) return;
      setFieldState(name, isEmailLike(value), isEmailLike(value) ? "Email format looks good." : "Enter a valid email.");
      return;
    }
    if (name === "username") {
      if (!value.trim()) return;
      setFieldState(
        name,
        isUsernameLike(value),
        isUsernameLike(value) ? "Username available format." : "Use 3-32 chars with letters, numbers, underscore.",
      );
      return;
    }
    if (name === "confirmPassword") {
      if (!value.trim()) return;
      const ok = value === password;
      setFieldState(name, ok, ok ? "Passwords match." : "Passwords do not match.");
    }
  }

  function handleCaps(event) {
    setCapsOn(Boolean(event.getModifierState && event.getModifierState("CapsLock")));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setInfo("");

    try {
      const result = await onLogin({
        identifier: identifier.trim(),
        username,
        email,
        password,
        remember,
        mode,
        role,
        newAdminKey,
        deferSessionMs: mode === "login" ? 360 : 0,
      });

      if (mode === "register") {
        const successParts = ["Account created successfully. Please login."];
        if (result?.admin_creation_key) {
          successParts.push(`Admin Creation Key (shown once): ${result.admin_creation_key}`);
        }
        setMode("login");
        setRoleUi("user");
        setRole("user");
        setNewAdminKey("");
        setUsername("");
        setEmail("");
        setIdentifier("");
        setPassword("");
        setConfirmPassword("");
        setInfo(successParts.join(" "));
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  function onRoleChange(uiRole, backendRole) {
    setRoleUi(uiRole);
    setRole(backendRole);
  }

  const submitLabel = mode === "register" ? (submitting ? "Creating Account..." : "Create Account") : submitting ? "Authenticating..." : "Login";

  return (
    <div className="green-shell">
      <ParticleBackground />
      <DriftingOrbs />
      <DotGrid />

      <div className={`green-center-wrapper ${mode === "register" ? "is-register" : ""}`}>
        <form className={`green-card ${mode === "register" ? "green-card-register" : ""}`} ref={cardRef} onSubmit={handleSubmit} autoComplete="off">
          <input type="text" name="decoy_username" autoComplete="username" tabIndex={-1} aria-hidden="true" className="green-decoy" />
          <input
            type="password"
            name="decoy_password"
            autoComplete="current-password"
            tabIndex={-1}
            aria-hidden="true"
            className="green-decoy"
          />

          <div className="green-card-head">
            <Logo />
            <p>Secure Authentication</p>
          </div>

          <div className="green-tab-wrap" role="tablist" aria-label="Authentication modes">
            <span className={`green-tab-indicator ${mode === "register" ? "is-register" : "is-login"}`} aria-hidden="true" />
            <button
              id={loginTabId}
              role="tab"
              aria-selected={mode === "login"}
              aria-controls="auth-panel-login"
              className={`green-tab ${mode === "login" ? "is-active" : ""}`}
              type="button"
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              id={registerTabId}
              role="tab"
              aria-selected={mode === "register"}
              aria-controls="auth-panel-register"
              className={`green-tab ${mode === "register" ? "is-active" : ""}`}
              type="button"
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={mode === "login" ? loginTabId : registerTabId}
            className="green-form"
          >
            {mode === "login" && (
              <>
                <label htmlFor="login_identifier" className="green-field">
                  <span className="green-field-float">Email or Username</span>
                  <span className="green-field-icon">
                    <IconMail size={15} />
                  </span>
                  <input
                    id="login_identifier"
                    className="green-input"
                    type="text"
                    name="login_identifier"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder=" "
                    required
                  />
                </label>

                <label htmlFor="login_password" className="green-field">
                  <span className="green-field-float">Password</span>
                  <span className="green-field-icon">
                    <IconLock size={15} />
                  </span>
                  <input
                    id="login_password"
                    className="green-input"
                    type={showLoginPassword ? "text" : "password"}
                    name="login_password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handleCaps}
                    onClick={handleCaps}
                    placeholder=" "
                    required
                  />
                  <button
                    type="button"
                    className="green-eye"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                  >
                    {showLoginPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </label>
              </>
            )}

            {mode === "register" && (
              <>
                <p className="green-section-label">Your Identity</p>

                <label htmlFor="register_email" className="green-field">
                  <span className="green-field-float">Email</span>
                  <span className="green-field-icon">
                    <IconMail size={15} />
                  </span>
                  <input
                    id="register_email"
                    className={`green-input ${fieldFeedback.email?.valid === false ? "is-invalid" : fieldFeedback.email?.valid ? "is-valid" : ""}`}
                    type="email"
                    name="register_email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => onBlurField("email", e.target.value)}
                    placeholder=" "
                    required
                  />
                  {fieldFeedback.email?.message && (
                    <span className={`green-inline-msg ${fieldFeedback.email.valid ? "ok" : "bad"}`}>
                      {fieldFeedback.email.valid ? <IconCheckCircle size={12} /> : <IconAlert size={12} />}
                      {fieldFeedback.email.message}
                    </span>
                  )}
                </label>

                <label htmlFor="register_username" className="green-field">
                  <span className="green-field-float">Username</span>
                  <span className="green-field-icon">
                    <IconUser size={15} />
                  </span>
                  <input
                    id="register_username"
                    className={`green-input ${fieldFeedback.username?.valid === false ? "is-invalid" : fieldFeedback.username?.valid ? "is-valid" : ""}`}
                    type="text"
                    name="register_username"
                    autoComplete="nickname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={(e) => onBlurField("username", e.target.value)}
                    placeholder=" "
                    required
                  />
                  {fieldFeedback.username?.message && (
                    <span className={`green-inline-msg ${fieldFeedback.username.valid ? "ok" : "bad"}`}>
                      {fieldFeedback.username.valid ? <IconCheckCircle size={12} /> : <IconAlert size={12} />}
                      {fieldFeedback.username.message}
                    </span>
                  )}
                </label>

                <p className="green-section-label">Your Security</p>

                <label htmlFor="register_password" className="green-field">
                  <span className="green-field-float">Password</span>
                  <span className="green-field-icon">
                    <IconLock size={15} />
                  </span>
                  <input
                    id="register_password"
                    className="green-input"
                    type={showRegisterPassword ? "text" : "password"}
                    name="register_password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handleCaps}
                    onClick={handleCaps}
                    placeholder=" "
                    required
                  />
                  <button
                    type="button"
                    className="green-eye"
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                  >
                    {showRegisterPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                  {capsOn && <span className="green-caps">Caps Lock is ON</span>}
                </label>

                <PasswordStrengthBar score={strength.score} label={strength.label} />

                <label htmlFor="register_confirm_password" className="green-field">
                  <span className="green-field-float">Confirm Password</span>
                  <span className="green-field-icon">
                    <IconShieldCheck size={15} />
                  </span>
                  <input
                    id="register_confirm_password"
                    className={`green-input ${fieldFeedback.confirmPassword?.valid === false ? "is-invalid" : fieldFeedback.confirmPassword?.valid ? "is-valid" : ""}`}
                    type={showConfirmPassword ? "text" : "password"}
                    name="register_confirm_password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (e.target.value.length > 0) {
                        onBlurField("confirmPassword", e.target.value);
                      }
                    }}
                    onBlur={(e) => onBlurField("confirmPassword", e.target.value)}
                    placeholder=" "
                    required
                  />
                  <button
                    type="button"
                    className="green-eye"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                  {fieldFeedback.confirmPassword?.message && (
                    <span className={`green-inline-msg ${fieldFeedback.confirmPassword.valid ? "ok" : "bad"}`}>
                      {fieldFeedback.confirmPassword.valid ? <IconCheckCircle size={12} /> : <IconAlert size={12} />}
                      {fieldFeedback.confirmPassword.message}
                    </span>
                  )}
                </label>

                <p className="green-password-note">Use 8+ chars with uppercase, lowercase, number, and special character.</p>

                <p className="green-section-label">Your Access</p>
                <CustomDropdown value={roleUi} onChange={onRoleChange} adminExists={signupMeta.admin_exists} />

                {role === "admin" && (
                  <label htmlFor="register_new_admin_key" className="green-field">
                    <span className="green-field-float">Create Admin Creation Key</span>
                    <span className="green-field-icon">
                      <IconKey size={15} />
                    </span>
                    <input
                      id="register_new_admin_key"
                      className="green-input"
                      type={showNewAdminKey ? "text" : "password"}
                      name="register_new_admin_key"
                      autoComplete="new-password"
                      value={newAdminKey}
                      onChange={(e) => setNewAdminKey(e.target.value)}
                      placeholder=" "
                      required
                    />
                    <button
                      type="button"
                      className="green-eye"
                      aria-label={showNewAdminKey ? "Hide password" : "Show password"}
                      onClick={() => setShowNewAdminKey((prev) => !prev)}
                    >
                      {showNewAdminKey ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </label>
                )}
              </>
            )}
          </div>

          <div className="green-meta">
            <div className="green-toggle-wrap">
              <button
                type="button"
                className={`green-toggle ${remember ? "is-on" : ""}`}
                role="switch"
                aria-checked={remember}
                onClick={() => setRemember(!remember)}
              >
                <span className="green-toggle-knob" />
              </button>
              <span className="green-toggle-label">Remember me</span>
            </div>
            <button type="button" className="green-forgot">
              <IconKey size={13} />
              Forgot password?
            </button>
          </div>

          <button type="submit" className={`green-cta ${submitting ? "is-loading" : ""}`} disabled={submitting}>
            <span>{submitLabel}</span>
            {submitting ? <span className="green-spinner" aria-hidden="true" /> : mode === "register" ? <IconUserPlus size={16} /> : <IconLogin size={16} />}
          </button>

          <div className="green-trust">
            <span>
              <IconLock size={12} />
              256-bit Encryption
            </span>
            <span>
              <IconShieldCheck size={12} />
              SOC 2 Compliant
            </span>
            <span>
              <IconKey size={12} />
              Zero Knowledge
            </span>
          </div>

          {error && (
            <p className="green-feedback green-error" role="alert" aria-live="polite">
              <IconAlert size={14} />
              {error}
            </p>
          )}
          {info && (
            <p className="green-feedback green-success" role="status" aria-live="polite">
              <IconCheckCircle size={14} />
              {info}
            </p>
          )}
          <p className="green-hintline">
            <IconInfo size={13} />
            Use organization-approved credentials for audit-safe access.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
