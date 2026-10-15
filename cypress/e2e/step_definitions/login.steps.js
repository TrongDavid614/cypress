import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

Given("Người dùng truy cập trang đăng nhập {string}", (url) => {
  cy.clearLocalStorage();
  cy.visit(url);
});

When("Người dùng nhập thông tin đăng nhập hợp lệ từ fixture {string}", (fixtureName) => {
  cy.fixture(fixtureName).then((data) => {
    const { email, password } = data.validUser;
    cy.get('input[placeholder*="tên đăng nhập"], input[type="text"]').clear().type(email);
    cy.get('input[placeholder="••••••••"], input[type="password"]').clear().type(password);
  });
});

When("Người dùng nhập thông tin đăng nhập không hợp lệ từ fixture {string}", (fixtureName) => {
  cy.fixture(fixtureName).then((data) => {
    const { email, password } = data.invalidUser;
    cy.get('input[placeholder*="tên đăng nhập"], input[type="text"]').clear().type(email);
    cy.get('input[placeholder="••••••••"], input[type="password"]').clear().type(password);
  });
});

When("Người dùng nhấn nút {string}", (btnText) => {
  cy.contains("button", btnText).click();
});

Then("Hệ thống thông báo đăng nhập thành công", () => {
  cy.contains(/Đăng nhập thành công/i, { timeout: 8000 }).should("be.visible");
});

Then("Người dùng được chuyển hướng đến trang mua vé {string}", (expectedUrl) => {
  cy.url({ timeout: 10000 }).should("include", expectedUrl);
});

Then("Người dùng được chuyển hướng đến trang mua vé hoặc trang chủ", () => {
  cy.url({ timeout: 10000 }).should("include", "/page/concerts");
});

Then("Màn hình kết thúc tải và chữ {string} biến mất", (loadingText) => {
  // Chờ lớp phủ LOADING... kết thúc tải và biến mất hoàn toàn
  cy.contains(loadingText, { timeout: 15000 }).should("not.exist");
});

Then("Nút đăng nhập không còn hiển thị trên thanh điều hướng", () => {
  // Nút 'Đăng nhập' trên header không còn tồn tại sau khi user đăng nhập thành công
  cy.contains("button", /Đăng nhập|Login/i).should("not.exist");
});

Then("Thanh điều hướng hiển thị tên người dùng {string}", (userName) => {
  cy.contains(userName, { timeout: 10000 }).should("be.visible");
});

Then("Danh sách sự kiện được hiển thị thành công", () => {
  // Kiểm tra thanh tìm kiếm và thẻ concert đã được hiển thị trên trang /page/concerts
  cy.get('input[placeholder*="Tìm kiếm sự kiện"]', { timeout: 10000 }).should("be.visible");
  cy.contains(/Giá từ/i, { timeout: 10000 }).should("be.visible");
});

Then("Hệ thống hiển thị thông báo lỗi {string}", (errorMsg) => {
  cy.contains(new RegExp(errorMsg, "i"), { timeout: 8000 }).should("be.visible");
});

Then("Người dùng vẫn ở lại trang đăng nhập", () => {
  cy.url().should("include", "/page/login");
});

// ─── TC_AUTH_03: Nhập email + password rời (email không tồn tại) ──────────
When("Người dùng nhập email {string} và mật khẩu {string}", (email, password) => {
  cy.get('input[placeholder*="tên đăng nhập"], input[type="text"]').clear().type(email);
  cy.get('input[placeholder="••••••••"], input[type="password"]').clear().type(password);
});

// ─── TC_AUTH_04: Để trống cả 2 field rồi bấm LOGIN ───────────────────────
When("Người dùng không nhập gì và bấm nút {string}", (btnText) => {
  // Đảm bảo 2 trường trống hoàn toàn rồi click
  cy.get('input[placeholder*="tên đăng nhập"], input[type="text"]').clear();
  cy.get('input[placeholder="••••••••"], input[type="password"]').clear();
  cy.contains("button", btnText).click();
});

Then("Hệ thống chặn submit và hiển thị lỗi trường bắt buộc", () => {
  // HTML5 required validation hoặc custom error message
  // Kiểm tra: URL không đổi (không redirect) HOẶC có thông báo lỗi
  cy.url().should("include", "/page/login");
  // Nếu app có custom error message:
  cy.get("body").then(($body) => {
    const hasValidationMsg =
      $body.find(':invalid').length > 0 ||
      $body.text().match(/bắt buộc|không được để trống|required/i);
    // Chấp nhận 1 trong 2 cách báo lỗi (HTML5 native hoặc custom)
    expect(hasValidationMsg).to.be.ok;
  });
});
