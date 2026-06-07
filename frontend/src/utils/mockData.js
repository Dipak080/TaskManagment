// Fallback sample data so the UI renders before the CI4 API is available.
// Mirrors the shape the backend returns.
export const MOCK_DEPARTMENTS = [
  'Accounts', 'Purchase', 'Logistics', 'Production', 'Planning', 'Sales', 'Marketing', 'Lab', 'Administration',
];

export const MOCK_USERS = [
  { id: 1, name: 'Rajan K.', department: 'Accounts' },
  { id: 2, name: 'Meena S.', department: 'Administration' },
  { id: 3, name: 'Ajay V.', department: 'Planning' },
  { id: 4, name: 'Priya N.', department: 'Purchase' },
  { id: 5, name: 'Dilip R.', department: 'Logistics' },
  { id: 6, name: 'Suresh L.', department: 'Lab' },
  { id: 7, name: 'Ravi M.', department: 'Sales' },
];

export const MOCK_TASKS = [
  {
    id: 31, code: 'TASK-0031', title: 'GST Notice Reply — TDS Q4 FY2025',
    department: 'Accounts', created_by: 'Admin', assignee_name: 'Rajan K.',
    due_date: '2026-05-28', status: 'pending', priority: 'urgent',
    description: 'GST department has issued a notice regarding TDS mismatch for Q4 FY2025. Response must be filed with supporting documents.',
  },
  {
    id: 28, code: 'TASK-0028', title: 'Electricity Bill Payment — Plant 2',
    department: 'Administration', created_by: 'Admin', assignee_name: 'Meena S.',
    due_date: '2026-05-27', status: 'pending', priority: 'urgent',
    description: 'Electricity bill for Plant 2 is due. Non-payment will result in disconnection within 48 hours.',
  },
  {
    id: 34, code: 'TASK-0034', title: 'Raw Material Stock Report — Bokaro Order',
    department: 'Planning', created_by: 'Technical Head', assignee_name: 'Ajay V.',
    due_date: '2026-05-30', status: 'in_progress', priority: 'high',
    description: 'Technical Head requires updated stock levels before dispatch planning for Bokaro Steel Plant order.',
  },
  {
    id: 33, code: 'TASK-0033', title: 'Machinery Purchase Approval — Hydraulic Press',
    department: 'Purchase', created_by: 'Mech. Head', assignee_name: 'Priya N.',
    due_date: '2026-05-31', status: 'pending', priority: 'high',
    description: 'Mechanical Head has approved the requisition for 2x hydraulic press maintenance parts. Purchase order to be raised.',
  },
  {
    id: 36, code: 'TASK-0036', title: 'Lab Test Report — Batch #BK-2209',
    department: 'Lab', created_by: 'Lab Head', assignee_name: 'Suresh L.',
    due_date: '2026-06-02', status: 'in_progress', priority: 'medium',
    description: 'Daily raw material test results for incoming batch #BK-2209 from Bokaro. Lab to submit results to Purchase and Planning.',
  },
  {
    id: 35, code: 'TASK-0035', title: 'Dispatch Vehicle Booking — Bokaro Steel',
    department: 'Logistics', created_by: 'Planning', assignee_name: 'Dilip R.',
    due_date: '2026-06-01', status: 'pending', priority: 'medium',
    description: 'Planning has confirmed dispatch date for Bokaro Steel Plant. Logistics to arrange vehicle for 3 Jun dispatch.',
  },
  {
    id: 30, code: 'TASK-0030', title: 'Online Tender Submission — NHB Portal',
    department: 'Sales', created_by: 'Admin', assignee_name: 'Ravi M.',
    due_date: '2026-06-05', status: 'in_progress', priority: 'low',
    description: 'Online tender portal deadline. Documents to be prepared and submitted by Purchase team representative.',
  },
];
