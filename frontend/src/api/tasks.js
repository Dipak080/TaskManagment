import client from './client';

// Task API wrapper. Each call returns the parsed `data` payload from the CI4 API.
export const TasksApi = {
  list: (params = {}) => client.get('/tasks', { params }).then((r) => r.data),
  get: (id) => client.get(`/tasks/${id}`).then((r) => r.data),
  create: (payload) => {
    const isFormData = payload instanceof FormData;
    // For FormData, let the browser set "multipart/form-data; boundary=…".
    // Forcing a bare "multipart/form-data" omits the boundary and the server
    // can't parse the body (fields/files come through empty → create fails).
    return client.post('/tasks', payload, {
      headers: isFormData ? { 'Content-Type': undefined } : {},
    }).then((r) => r.data);
  },
  update: (id, payload) => client.put(`/tasks/${id}`, payload).then((r) => r.data),
  delete: (id) => client.delete(`/tasks/${id}`).then((r) => r.data),
  transition: (id, payload) => client.post(`/tasks/${id}/transition`, payload).then((r) => r.data),
  setStatus: (id, statusId, reason = '') =>
    client.post(`/tasks/${id}/transition`, { action: 'set_status', status_id: statusId, reason }).then((r) => r.data),
  transfer: (id, payload) => client.post(`/tasks/${id}/transfer`, payload).then((r) => r.data),
  stats: () => client.get('/stats').then((r) => r.data),
  comments: (id) => client.get(`/tasks/${id}/comments`).then((r) => r.data),
  addComment: (id, body, author = 'Admin') =>
    client.post(`/tasks/${id}/comments`, { body, author }).then((r) => r.data),
  activity: (id) => client.get(`/tasks/${id}/activity`).then((r) => r.data),
  addAttachments: (id, files) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('attachments[]', f));
    return client.post(`/tasks/${id}/attachments`, fd, {
      headers: { 'Content-Type': undefined },
    }).then((r) => r.data);
  },
  deleteAttachment: (id, attId) => client.delete(`/tasks/${id}/attachments/${attId}`).then((r) => r.data),
  addChecklist: (id, payload) => client.post(`/tasks/${id}/checklists`, payload).then((r) => r.data),
  updateChecklist: (id, checklistId, payload) => client.put(`/tasks/${id}/checklists/${checklistId}`, payload).then((r) => r.data),
  deleteChecklist: (id, checklistId) => client.delete(`/tasks/${id}/checklists/${checklistId}`).then((r) => r.data),
};

export const MetaApi = {
  departments: () => client.get('/departments').then((r) => r.data),
  users: () => client.get('/users').then((r) => r.data),
};

export const ReportsApi = {
  eod: (params) => client.get('/reports/eod', { params }).then((r) => r.data),
};
