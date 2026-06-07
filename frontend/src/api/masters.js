import client from './client';

export const MastersApi = {
  /**
   * Fetch all records for a specific master type.
   * @param {string} type The backend table name (e.g. 'divisions', 'departments')
   */
  async list(type) {
    const { data } = await client.get(`/masters/${type}`);
    return data;
  },

  /**
   * Create a new record for a master type.
   * @param {string} type The backend table name
   * @param {object} payload The fields to save
   */
  async create(type, payload) {
    const { data } = await client.post(`/masters/${type}`, payload);
    return data;
  },

  /**
   * Update an existing record, including toggling its is_active status.
   * @param {string} type The backend table name
   * @param {number} id The ID of the record
   * @param {object} payload The fields to update
   */
  async update(type, id, payload) {
    const { data } = await client.put(`/masters/${type}/${id}`, payload);
    return data;
  },

  /**
   * Soft delete a record.
   * @param {string} type The backend table name
   * @param {number} id The ID of the record
   */
  async delete(type, id) {
    const { data } = await client.delete(`/masters/${type}/${id}`);
    return data;
  }
};
