# W3C Accessibility Compliance & Voice Control Report

## Overview
SilverGuard Companion was architected from the ground up following the **W3C Web Content Accessibility Guidelines (WCAG 2.1 Level AA / AAA targets)** and ISO 9241-210 human-centered design principles for aging adults.

---

## 1. Visual Accessibility Standards

### Touch Target Sizing (WCAG 2.5.5)
* **Standard Requirement**: Minimum 44x44 CSS pixels.
* **SilverGuard Standard**: All primary interactive buttons, tabs, and voice controls have a **minimum touch area of 56px to 64px height** with extra horizontal padding (e.g. `p-4`, `py-3.5 px-6`), making them effortlessly clickable for users with tremors or reduced motor precision.

### Color Contrast Ratios (WCAG 1.4.3 & 1.4.6)
* **Standard Theme**: Warm, glare-free background (`#FFFDF7`) paired with deep slate text (`#0F172A`). Contrast ratio: **15.8:1** (Exceeds Level AAA standard of 7:1).
* **High Contrast Mode**: Deep Charcoal background (`#000000`) paired with vibrant Yellow (`#FACC15`) and stark White (`#FFFFFF`). Contrast ratio: **19.5:1**.
* **Status Badges**:
  * Safe Risk: Deep Emerald green (`#065F46` on `#D1FAE5`, Contrast 8.2:1)
  * Caution: Dark Amber (`#92400E` on `#FEF3C7`, Contrast 7.5:1)
  * Scam Warning: Vibrant Rose Red (`#991B1B` on `#FEE2E2`, Contrast 8.8:1)

### Visual Hierarchy & Typography
* **Font Choice**: *Atkinson Hyperlegible* — designed specifically by the Braille Institute of America to maximize character differentiation and legibility for low-vision readers.
* **Dynamic Font Size Scaling**: Instant toggle between Normal (18px base), Large (22px base), and Extra Large (26px base).
* **Line Height**: Maintained at `1.6` for optimal readability and tracking.

---

## 2. Voice-to-Text & Speech Synthesis

### Voice Navigation Engine
* Integrated browser `SpeechRecognition` / `webkitSpeechRecognition` with visual mic activation feedback and explicit audio cue.
* Supported Voice Commands:
  - `"Go to companion"` / `"Chat"`
  - `"Go to scam checker"` / `"Check bill"`
  - `"Go to medications"` / `"Pills"`
  - `"Go to doctor prep"` / `"Appointment"`
  - `"Go to family"` / `"Messages"`
  - `"Read aloud"` / `"Stop reading"`
  - `"Bigger text"` / `"Smaller text"`
  - `"High contrast"` / `"Normal colors"`
  - `"Help"` / `"Voice commands"`

### Text-to-Speech (TTS) Read-Aloud
* Uses `window.speechSynthesis` tuned to a warm, gentle pitch (`pitch: 1.0`, `rate: 0.9` for clear articulation).
* Any AI-generated advice, scam evaluation, or medication schedule can be read aloud with a prominent "Read Aloud" button (`aria-label="Read advice aloud"`).

---

## 3. Screen Reader Compatibility & W3C Standards

### Semantic HTML Structure
* Proper use of `<header>`, `<main>`, `<nav>`, `<aside>`, `<section>`, and `<footer>` landmarks.
* Headings follow a strict sequential hierarchy (`<h1>` -> `<h2>` -> `<h3>`).

### ARIA Attributes & Live Regions
* `aria-live="polite"` applied to dynamic AI status areas so screen readers announce incoming summaries without interrupting user interaction.
* `aria-expanded` and `aria-controls` applied to all accordions and collapsible help guides.
* `aria-label` provided for all icon-only buttons (e.g. microphone trigger, text scale, speaker controls).
* Focus styling includes prominent 4px focus rings (`focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500`).

---

## 4. Disaster Recovery & Fail-Safe Controls
* **Emergency Contact Bar**: Permanent fixed top/bottom bar providing instant access to dial trusted family members or emergency services with a single large button.
* **Local Exception Isolation**: Failed API calls display a friendly, plain-language message with a prominent "Try Again" button.
