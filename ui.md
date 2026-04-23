# UI Perfection Roadmap: Meneharia 2.0

This document outlines the three-phase transformation of the Bahir Dar Transportation System into a premium, multilingual, and world-class logistics platform.

---

## Phase 1: Global Access & i18n Foundation
**Goal:** Enable full language support and audit the codebase for text standardization.

1.  **i18n Infrastructure:**
    *   Integrate `i18next` and `react-i18next` into the frontend core.
    *   Create structural locale folders: `locales/en` and `locales/am`.
2.  **Language Registry:**
    *   Audit **every** hardcoded string in Dashboards, Maps, and Bookings.
    *   Implement a `useTranslation` hook pattern across all functional components.
3.  **The Language Hub:**
    *   Add a premium "Language Switcher" in the Global Header/Navbar.
    *   Persistent language selection (saves to LocalStorage).

---

## Phase 2: The "Master Sidebar" & Navigation Overhaul
**Goal:** Transform navigation from functional into a premium "Control Center" experience.

1.  **Universal Sidebar Engine:**
    *   Design a unified, highly-responsive sidebar system.
    *   Add glassmorphism effects (backdrop-blur) and custom gradients.
    *   Implement "Collapsible" states for maximum workspace efficiency.
2.  **Role-Specific Visual Identity:**
    *   **Admin Console:** Deep blues and high-contrast telemetry indicators.
    *   **Driver Dashboard:** Large, high-touch target areas for mobile management.
    *   **Passenger Hub:** Friendly, welcoming design with glowing status cards.
3.  **Active-State Intelligence:**
    *   Dynamic route highlighting in nav.
    *   Pulsing notification badges integrated directly into the sidebar icons.

---

## Phase 3: Visual Polish & Data "Sanitization"
**Goal:** Remove "developer rough edges" and achieve 100% brand consistency.

1.  **Label Excellence (The "Underscore Removal"):**
    *   Audit all table headers and cards.
    *   Automatically convert `snake_case` or `camelCase` labels into **Elegant Title Case** (e.g., `plate_number` → `Plate Number`).
2.  **Premium Component Upgrade:**
    *   **Shadows & Depth:** Replace flat borders with soft, layered shadow systems.
    *   **Typography:** Standardize font weights (Inter/Outfit) for better hierarchy.
    *   **Animations:** Add `framer-motion` for page transitions and card hover states.
3.  **Meneharia Branding Audit:**
    *   Apply the unified color palette (Bahir Dar Blue & Safety Amber).
    *   Ensure all buttons, inputs, and modals follow the new "Glass" design language.

---

**Status:** Ready for Phase 1 Execution.
