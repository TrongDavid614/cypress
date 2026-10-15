import './commands';

// Bỏ qua các ngoại lệ runtime từ bên thứ ba (three.js, toast, etc.) để không làm gián đoạn kiểm thử E2E
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});
