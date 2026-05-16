# Technology Stack

- **Frontend Framework:** Vue 3  
- **Build Tool:** Vite  
- **State Management:** Pinia  
- **Routing:** Vue Router  
- **Data Visualization:** Chart.js (`vue-chartjs`)  
- **Data Export/Parsing:** SheetJS (`xlsx`)  
- **Deployment:** Vercel (`vercel.json` configured)  

# Core Architecture

## 1. State Management (Pinia Stores)

The application relies on modular Pinia stores (`src/stores/`) to handle global state, cleanly separating concerns into specific domains:

- **authStore.js:** Manages user authentication, session state, and Role-Based Access Control (RBAC).  
- **goalStore.js:** Handles creation, tracking, and management of user and team goals.  
- **checkinStore.js:** Manages progress check-ins and performance updates.  
- **escalationStore.js:** Contains rules and logs for the rule-based escalation engine.  
- **kpiStore.js:** Manages Key Performance Indicators (KPIs) pushed by administrators.  
- **auditStore.js:** Maintains the audit trails for system actions and security logs.  
- **toastStore.js:** Manages global UI notifications.  

## 2. Routing & Security

Vue Router (`src/router/index.js`) is implemented with strict Role-Based Access Control. The application utilizes global navigation guards (`router.beforeEach`) to ensure secure routing based on the authenticated user's role.

### Roles and Access

#### Employee
- Access to personal goals (`MyGoals`)  
- Access to check-ins (`CheckIn`)  
- Access to goal creation (`GoalSheet`)  

#### Manager
- Access to team-wide data  
- Access to team goals (`TeamGoals`)  
- Access to employee reviews (`ReviewGoal`)  
- Access to team check-ins (`TeamCheckins`)  

#### Admin
- Full access to administrative tools including:
  - Escalation configurations (`EscalationRules`)  
  - System audit trails (`AuditTrail`)  
  - Performance reports (`Reports`)  
  - Analytics (`Analytics`)  

## 3. Application Structure (`src/`)

### `components/`
Reusable UI components and layout wrappers (`components/layout/`).

### `views/`
Page-level components logically grouped by role domain:

- **admin/** — Configuration, audits, and high-level analytics  
- **employee/** — Standard user workflows  
- **manager/** — Oversight and review workflows  
- **shared/** — Common views like the primary Dashboard and public Login portal  

## 4. Bonus Modules

### Analytics & Reporting Module
Facilitates Quarter-on-Quarter (QoQ) trend analysis and interactive visualizations such as heatmaps and progress charts powered by Chart.js.

### Rule-Based Escalation Engine
An automated compliance tool that detects and tracks overdue actions such as unsubmitted goals and missing check-ins, while logging incidents transparently for HR.
