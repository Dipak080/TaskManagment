import client from './client';

export const AuthApi = {
  login: (email, password) =>
    client.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => client.get('/auth/me').then((r) => r.data),
  logout: () => client.post('/auth/logout').then((r) => r.data),
  requestRegisterOtp: (email) =>
    client.post('/auth/register/request-otp', { email }).then((r) => r.data),
  register: (payload) => client.post('/auth/register', payload).then((r) => r.data),
};

export const RolesApi = {
  list: () => client.get('/roles').then((r) => r.data),
  create: (payload) => client.post('/roles', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/roles/${id}`, payload).then((r) => r.data),
  delete: (id) => client.delete(`/roles/${id}`).then((r) => r.data),
  permissions: (id) => client.get(`/roles/${id}/permissions`).then((r) => r.data),
  savePermissions: (id, matrix) => client.put(`/roles/${id}/permissions`, { matrix }).then((r) => r.data),
};

export const UsersApi = {
  list: () => client.get('/users').then((r) => r.data),
  create: (payload) => client.post('/users', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/users/${id}`, payload).then((r) => r.data),
  delete: (id) => client.delete(`/users/${id}`).then((r) => r.data),
};

export const CompanyApi = {
  get: () => client.get('/company').then((r) => r.data),
  update: (payload) => client.put('/company', payload).then((r) => r.data),
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    return client.post('/company/logo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export const AdminApi = {
  companies: () => client.get('/admin/companies').then((r) => r.data),
  company: (id) => client.get(`/admin/companies/${id}`).then((r) => r.data),
  createCompany: (payload) => client.post('/admin/companies', payload).then((r) => r.data),
  updateCompany: (id, payload) => client.put(`/admin/companies/${id}`, payload).then((r) => r.data),
  createAdminUser: (companyId, payload) =>
    client.post(`/admin/companies/${companyId}/admin-user`, payload).then((r) => r.data),
};
