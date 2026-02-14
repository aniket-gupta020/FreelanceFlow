# 🧪 FreelanceFlow Testing Guide

> **Comprehensive QA Protocols & Validation Steps.**

Ensure the stability and reliability of FreelanceFlow by following these structured test cases.

## 📋 Table of Contents

- [1. Onboarding & Environment](#1-onboarding--environment)
- [2. Feature Validation](#2-feature-validation)
- [3. UI/UX Responsiveness](#3-uiux-responsiveness)
- [4. Critical User Flows](#4-critical-user-flows)

---

## 1. Onboarding & Environment

### 🔹 Sample Data Loading
- **Action**: Click the "Load Sample Data" button on the Dashboard.
- **Expected Outcome**:
  - The UI instantly populates with mock clients, projects, and invoices.
  - A success toast notification appears.
  - No errors in the browser console.

### 🔹 Authentication Persistence
- **Action**: Log in, refresh the page, then close and reopen the browser tab.
- **Expected Outcome**:
  - The user remains logged in (JWT token persists in `localStorage`).
  - navigating to `/login` redirects to the Dashboard.
- **Session Expiry**:
  - Manually clear `localStorage` and refresh.
  - **Expected Outcome**: auto-logout and redirect to `/login`.

---

## 2. Feature Validation

| Feature | Test Case | Expected Outcome |
| :--- | :--- | :--- |
| **Subscription** | Create > 2 clients on Free Plan. | User is blocked and prompted to "Upgrade to Pro". |
| **Project Logic** | **Critical**: Set "Start Date" after "Deadline". | Form submission fails with a validation error. |
| **Invoicing** | Generate an invoice with multiple items. | Subtotal + Tax is calculated correctly. PDF downloads. |
| **Data Integrity** | Delete a client with active projects. | Client enters "Ghost Mode" (Soft Delete); history is preserved. |

---

## 3. UI/UX Responsiveness

### 🖥️ Desktop
- **Sidebar**: Locked to the left side of the screen.
- **Navigation**: Smooth transitions between pages.
- **Charts**: Tooltips appear on hover over Dashboard charts.

### 📱 Mobile (<768px)
- **Sidebar**: Hidden by default.
- **Hamburger Menu**: Toggles the overlay menu smoothly.
- **Toasts**: Notifications appear at the **bottom-center** (vs top-center on Desktop).
- **PDFs**: Invoices are legible and correctly formatted on smaller screens.

---

## 4. Critical User Flows

### 🔄 The "Freelance Cycle"
1. **Create Client**: Add a new client with valid details.
2. **Add Project**: specific to that client, with a valid deadline.
3. **Log Time**: Use the stopwatch or manual entry to log 2 hours.
4. **Generate Invoice**: Create an invoice for the logged project.
5. **Mark as Paid**: Update invoice status and verify revenue update on Dashboard.

---

> **Note**: For automated testing updates or bug reports, please refer to the project repository issues section.
