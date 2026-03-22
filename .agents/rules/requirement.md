---
trigger: always_on
description: Product requirements and user flow specification for AlloCat
---

# AlloCat — Product Requirements

## Overview

**AlloCat** is a minimalist, manual personal finance control system. It is a **structured, power-user finance tool** — not a beginner-level or automated system.

### Core Objectives
- Full control over personal finances
- Replace unstructured note-based tracking
- Enable disciplined budgeting with clear financial visibility
- Maintain long-term financial history

### Target User
- Individuals actively managing money who are comfortable with manual tracking and seek financial discipline.

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Auth & DB:** Supabase (Auth + PostgreSQL + Row Level Security)

---

## Feature Map

| Feature | Description |
|---------|-------------|
| Dashboard | Financial overview: budget summary, net worth chart, goals |
| Budget System | Monthly planning with category AlloCations |
| Category Tracking | Detailed spending control per category with line items |
| Net Worth Tracking | Asset & liability monitoring with distribution chart |
| Debt Tracking | Internal & external liability management with payment flow |
| Goals | Financial target setting and progress tracking |
| Reports | Monthly reflections with notes & comparisons |

---

## Navigation Flow

```
Login → Dashboard → Budget → Category → Items
                  ↓
              Net Worth
                  ↓
                Debt
                  ↓
               Report
```

**Bottom Navigation Tabs:** Dashboard | Budget | Net Worth | Debt

---

## Authentication

### Sign Up
1. User inputs: Name, Email, Password
2. Account created via Supabase Auth
3. Profile record created in DB
4. Redirect to Dashboard

### Login
1. Enter credentials → Supabase Auth
2. Fetch user data
3. Navigate to Dashboard

---

## Dashboard

### Purpose
Quick financial overview at a glance.

### Components
- **BudgetCard** — remaining budget display (editable inline)
- **NetWorthChart** — current net worth trend (line chart)
- **GoalCards** — list of goals with progress bars

### Actions
- View remaining budget, current net worth, goal progress
- Tap budget → inline edit → save → recalculate totals
- Navigate to sections via bottom tabs

---

## Budget System

### Purpose
Manage monthly financial planning.

### Flow
1. **Select Month** — load data for selected month
2. **View Budget** — total AlloCated, total spent, remaining
3. **Edit Budget** — tap amount → inline edit → save → recalculate categories
4. **View Categories** — Needs, Wants, Investments, Misc (each shows usage)
5. **Navigate to Category** — tap category → open detail page

---

## Category Detail

### Purpose
Track detailed spending within a budget category.

### Views & Actions
- **Summary:** AlloCated, used, remaining
- **Edit AlloCation:** tap → inline edit → save → update budget totals
- **Item List:** list of budget line items
- **Add Item:** tap "Add Item" → new row → enter name + planned amount → save
- **Edit Item:** edit name, planned amount, actual amount → updates category usage & remaining budget
- **Mark Complete:** toggle checkbox
- **Delete Item:** tap delete → confirm → remove
- **Historical Data:** view past trends (read-only)
- **Monthly Report:** view insights, add notes, lock month

---

## Month Lock

### Purpose
Freeze financial data for a completed month.

### Flow
1. User clicks "Lock Month" → confirm action
2. System locks all data for that month

### Effects
- All editing disabled (budget, items, categories)
- Only report notes remain editable

---

## Net Worth

### Purpose
Track financial assets and liabilities.

### Views & Actions
- **Summary:** total assets, total liabilities, net worth
- **Asset Distribution:** pie chart
- **Add Asset:** name, category, value → save
- **Edit Asset:** tap value → inline edit → save → recalculate net worth
- **Delete Asset:** tap delete → confirm → remove

---

## Debt Tracking

### Purpose
Track and manage liabilities.

### Views & Actions
- **Summary:** total outstanding, interest, trend
- **Toggle Type:** switch between Internal / External
- **Debt List:** active and closed debts
- **Add Debt:** enter details → save
- **Edit Debt:** edit principal, interest, paid amount → recalculates remaining & progress
- **Payment Flow:** enter payment → update paid → update remaining → if remaining = 0 → move to closed
- **Delete Debt:** tap delete → confirm → remove

---

## Goals

### Views & Actions
- **Add Goal:** name + target amount → save
- **Update Progress:** edit current amount → save → recalculate percentage
- **Delete Goal:** trigger delete → confirm → remove

---

## Reports

### Purpose
Monthly financial reflection.

### Content
- Budget vs actual comparison
- Savings analysis
- Overspending alerts
- Month-over-month comparisons

### Actions
- View report → add reflection notes → save (stored per month)

---

## System Behavior Rules

### Automatic Cascading Updates
- Budget changes → update categories
- Category changes → update items
- Asset changes → update net worth
- Debt changes → update net worth
- Goal updates → recalculate progress

### Data Consistency
- All values are linked — no manual recalculation required

---

## Validation Rules
- Amounts must be numeric
- No empty names allowed
- No negative values (except in debt logic)
- Overspending is allowed but must show a warning

---

## Error Handling
- Show clear, inline error messages
- Handle network failures gracefully
- Provide retry options

---

## Performance Requirements
- Fast screen loads
- Minimal API calls
- Efficient optimistic updates

---

## Security Requirements
- User-based data isolation
- Supabase Row Level Security (RLS) enforced on all tables
- No data leakage between users
