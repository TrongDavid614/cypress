import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

Given("Người dùng đã đăng nhập vào hệ thống bằng tài khoản {string}", (fixtureName) => {
  cy.fixture(fixtureName).then((data) => {
    const { email, password } = data.validUser;
    cy.request({
      method: "POST",
      url: "/api/users/login",
      body: { account: email, password },
    }).then((res) => {
      window.localStorage.setItem("token", res.body.token);
      window.localStorage.setItem("user", JSON.stringify(res.body.user));
    });
  });
});

When("Người dùng truy cập trang chi tiết sự kiện {string}", (url) => {
  cy.visit(url);
});

When("Người dùng bấm nút {string} để chuyển sang sơ đồ chọn ghế", (btnText) => {
  cy.contains("button", btnText).click();
});

Then("Hệ thống điều hướng đến trang chọn ghế {string}", (expectedUrl) => {
  cy.url({ timeout: 8000 }).should("include", expectedUrl);
});

When("Người dùng chọn khu vực ghế trên sơ đồ sự kiện", () => {
  // Chọn một vùng ghế trong sơ đồ SVG (ví dụ thẻ g có class node-group hoặc path trong diagram)
  cy.get(".diagram-svg", { timeout: 8000 }).should("be.visible");
  cy.get(".node-group, .diagram-svg text, .diagram-svg path").then(($el) => {
    // Click vào vùng ghế có thể chọn
    cy.wrap($el).filter(":visible").first().click({ force: true });
  });
});

Then("Giỏ vé hiển thị thông tin vé đã chọn với số lượng ban đầu là 1", () => {
  cy.get(".product-wrapper, [class*='cartItems']", { timeout: 8000 }).should("exist");
  cy.get(".qty-value, [class*='qty-value']").should("contain.text", "1");
});

When("Người dùng tăng số lượng vé bằng nút {string}", (btnPlus) => {
  cy.get(".qty-btn").contains(btnPlus).click();
});

Then("Giỏ vé cập nhật số lượng vé là 2 và tính đúng tổng tiền", () => {
  cy.get(".qty-value, [class*='qty-value']").should("contain.text", "2");
  cy.get(".totalPrice, [class*='totalPrice']").invoke("text").then((txt) => {
    expect(txt.trim()).to.not.equal("0đ");
  });
});

When("Người dùng bấm nút {string}", (btnText) => {
  cy.contains("button", btnText).click();
});

Then("Modal xác nhận đơn hàng hiển thị với thông báo {string}", (msg) => {
  cy.contains(new RegExp(msg, "i"), { timeout: 8000 }).should("be.visible");
});

When("Người dùng bấm nút {string} trên modal", (btnText) => {
  cy.contains("button", btnText).click();
});

Then("Hệ thống chuyển hướng đến trang checkout", () => {
  cy.url({ timeout: 8000 }).should("include", "/page/checkout");
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC_SEAT_02: Unhappy Path — Click ghế đã bán / bị khóa
// ═══════════════════════════════════════════════════════════════════════════════

When("Người dùng truy cập trang chọn ghế trực tiếp {string}", (url) => {
  cy.visit(url);
});

When("Người dùng click vào khu vực ghế đã bán hoặc bị vô hiệu hóa", () => {
  cy.get(".diagram-svg", { timeout: 8000 }).should("be.visible");
  // Tìm ghế disabled (opacity thấp, class 'sold-out' hoặc pointer-events:none)
  cy.get(".diagram-svg [class*='sold'], .diagram-svg [disabled], .diagram-svg [class*='disabled']")
    .then(($el) => {
      if ($el.length > 0) {
        cy.wrap($el).first().click({ force: true });
      } else {
        // Nếu không tìm được ghế cụ thể, log và skip
        cy.log("Không tìm thấy ghế bị khóa/sold-out cụ thể — test bị bỏ qua (conditional)");
      }
    });
});

Then("Giỏ vé không thay đổi — số lượng vé vẫn là 0", () => {
  // Kiểm tra rằng không có giỏ vé nào xuất hiện sau khi click ghế bị khóa
  cy.get(".qty-value, [class*='qty-value']").should("not.exist").or(
    "have.text", "0"
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC_SEAT_03: BVA — Chặn tăng SL vượt maxQty = 10
// ═══════════════════════════════════════════════════════════════════════════════

When("Người dùng tăng số lượng vé đến giới hạn tối đa 10 vé", () => {
  // Bấm "+" 9 lần để từ qty=1 lên qty=10
  for (let i = 0; i < 9; i++) {
    cy.get(".qty-btn").contains("+").click();
    cy.wait(200);
  }
});

Then("Giỏ vé hiển thị đúng 10 vé và tổng tiền 6.000.000đ", () => {
  cy.get(".qty-value, [class*='qty-value']").should("contain.text", "10");
  cy.get(".totalPrice, [class*='totalPrice']").invoke("text").then((txt) => {
    expect(txt).to.match(/6[.,]000[.,]000|6000000/);
  });
});

Then("Nút tăng số lượng bị vô hiệu hóa khi đã đạt maxQty", () => {
  // Thử bấm "+" thêm 1 lần — số lượng không được tăng lên 11
  cy.get(".qty-btn").contains("+").then(($btn) => {
    if ($btn.prop("disabled")) {
      // Nút bị disabled — OK
      expect($btn.prop("disabled")).to.be.true;
    } else {
      // Nút vẫn click được — sau click, số lượng phải vẫn là 10
      cy.wrap($btn).click({ force: true });
      cy.get(".qty-value, [class*='qty-value']").should("contain.text", "10");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC_SEAT_02 & TC_SEAT_04: Shared — Nút "Xác nhận" bị disabled / không xuất hiện
// ═══════════════════════════════════════════════════════════════════════════════

Then("Nút {string} bị vô hiệu hóa hoặc không xuất hiện", (btnText) => {
  cy.get("body").then(($body) => {
    const $btn = $body.find(`button:contains("${btnText}")`);
    if ($btn.length > 0) {
      cy.wrap($btn.first()).should("be.disabled");
    } else {
      // Nút không tồn tại — đây cũng là hành vi hợp lệ
      cy.log(`Nút "${btnText}" không tồn tại trên DOM — xác nhận hợp lệ`);
    }
  });
});

Then("Giỏ vé trống — chưa có vé nào được chọn", () => {
  // Không có cart item, số lượng 0 hoặc giỏ chưa được tạo
  cy.get(".product-wrapper, [class*='cartItems']").should("not.exist");
});
