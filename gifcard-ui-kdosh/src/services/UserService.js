import AppService from './AppService';

class UserService extends AppService {
  constructor() {
    super();
    this.path = this.getPath('api/users');
  }
  create(data) {
    return this.http.post(`${this.path}`, data);
  }
  update(data, id) {
    return this.http.put(`${this.path}/${id}`, data);
  }
  delete(id) {
    return this.http.delete(`${this.path}/${id}`);
  }
  deletePartner(id) {
    return this.http.delete(`${this.path}/delete-partner/${id}`);
  }
  deleteEmployee(id) {
    return this.http.delete(`${this.path}/delete-employee/${id}`);
  }
  deleteCustomer(id) {
    return this.http.delete(`${this.path}/delete-customer/${id}`);
  }
  listSearch(search='') {
    return this.http.get(`${this.path}?${search}`);
  }
  listCustomers(search='') {
    return this.http.get(`${this.path}/customers?${search}`);
  }
  listAccountPartner(search='') {
    return this.http.get(`${this.path}/account-partner?${search}`);
  }
  listAuthorizers(search='') {
    return this.http.get(`${this.path}/authorizers`);
  }
  me() {
    return this.http.get(`${this.path}/me`);
  }
  recoverCustomer(data) {
    return this.http.post(`${this.path}/recover-customer`, data);
  }
  reinitializerPasswordCustomer(data) {
    return this.http.post(`${this.path}/reinitializer-password-customer`, data);
  }
  searchBussiness(search = '') {
    return this.http.get(`${this.path}/search?${search}`);
  }
  recoverUser(id, data={}) {
    return this.http.put(`${this.path}/recover/${id}`, data);
  }
}

export default UserService;
