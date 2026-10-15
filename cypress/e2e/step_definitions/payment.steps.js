import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 1: KHỞI TẠO ĐƠN HÀNG TẠI TRANG CHECKOUT
// ═══════════════════════════════════════════════════════════════════════════════

Given("Người dùng đã đăng nhập và có giỏ vé hợp lệ trong hệ thống", () => {
  cy.fixture("user_data.json").then((data) => {
    const { email, password } = data.validUser;
    cy.request({
      method: "POST",
      url: "/api/users/login",
      body: { account: email, password },
    }).then((res) => {
      const user = res.body.user;
      const token = res.body.token;

      const mockCart = [
        {
          id: "tt008",
          ticketTypeId: "tt008",
          name: "Bí ẩn 2",
          ticketName: "Bí ẩn 2",
          price: 600000,
          unitPrice: 600000,
          color: "#e67e22",
          qty: 2,
          quantity: 2,
          itemTotal: 1200000,
          maxQty: 10,
        },
      ];

      const mockContext = {
        event: {
          eventId: "e001",
          name: "[CONCERT] Anh Trai Vượt Ngàn Chông Gai",
          venue: { name: "Central Park Stage", city: "Ho Chi Minh City" },
          time: { event: { start: "2026-06-01T17:00:00Z" } },
        },
        cart: mockCart,
      };

      window.localStorage.setItem("token", token);
      window.localStorage.setItem("user", JSON.stringify(user));
      window.localStorage.setItem("temp_cart", JSON.stringify(mockCart));
      window.localStorage.setItem("temp_checkout_context", JSON.stringify(mockContext));
    });
  });
});

When("Người dùng truy cập trang checkout sự kiện {string}", (eventId) => {
  cy.visit(`/page/checkout?eventId=${eventId}`);
});

When("Người dùng tích chọn đồng ý {string}", (_termText) => {
  cy.get('input[type="checkbox"]').check({ force: true });
});

When(
  "Người dùng nhập họ tên {string} và số điện thoại {string}",
  (fullName, phone) => {
    cy.get('input[placeholder*="họ và tên"]').clear().type(fullName);
    cy.get('input[placeholder*="số điện thoại"]').clear().type(phone);
  }
);

When("Người dùng chọn phương thức thanh toán {string}", (methodName) => {
  cy.contains(new RegExp(methodName.split("/")[0], "i")).click();
});

When("Người dùng nhấn nút xác nhận thanh toán trên trang checkout", () => {
  cy.contains("button", /Thanh Toán/i).click();
});

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 2: TRANG THANH TOÁN (PAYMENT) & REDIRECT SANG VNPAY SANDBOX
// ═══════════════════════════════════════════════════════════════════════════════

Then(
  "Hệ thống chuyển hướng đến trang thanh toán chứa tham số {string}",
  (paramName) => {
    cy.url({ timeout: 10000 }).should("include", `/page/payment?${paramName}=`);
  }
);

Then("Trang thanh toán hiển thị tiêu đề {string}", (titleText) => {
  cy.contains(new RegExp(titleText, "i"), { timeout: 10000 }).should(
    "be.visible"
  );
});

When("người dùng nhấn chuyển hướng sang cổng thanh toán VNPay", () => {
  cy.contains("button", /Đến cổng VNPAY sandbox/i, { timeout: 15000 })
    .should("be.enabled")
    .click();
});

Then("trình duyệt chuyển hướng đến cổng thanh toán VNPay Sandbox", () => {
  cy.origin("https://sandbox.vnpayment.vn", () => {
    cy.on("uncaught:exception", () => false);
    cy.url({ timeout: 20000 }).should("include", "sandbox.vnpayment.vn");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 3: ĐIỀN THẺ NCB, BẤM TIẾP TỤC & ĐỒNG Ý ĐIỀU KHOẢN
// ═══════════════════════════════════════════════════════════════════════════════

When("người dùng nhập thông tin thẻ test NCB:", (dataTable) => {
  const { cardNumber, cardHolder, issueDate } = dataTable.rowsHash();

  cy.origin(
    "https://sandbox.vnpayment.vn",
    { args: { cardNumber, cardHolder, issueDate } },
    ({ cardNumber, cardHolder, issueDate }) => {
      cy.on("uncaught:exception", () => false);

      cy.get("#card_number_mask, input[name='card_number_mask']", { timeout: 20000 })
        .filter(":visible")
        .first()
        .clear({ force: true })
        .type(cardNumber, { delay: 30, force: true });

      cy.get("#cardHolder, input[name='cardHolder']", { timeout: 10000 })
        .filter(":visible")
        .first()
        .clear({ force: true })
        .type(cardHolder, { delay: 30, force: true });

      cy.get("#cardDate, input[name='cardDate']", { timeout: 10000 })
        .filter(":visible")
        .first()
        .clear({ force: true })
        .type(issueDate, { delay: 30, force: true });
    }
  );
});

When("người dùng nhấn nút {string} trên cổng VNPay", (btnText) => {
  cy.origin("https://sandbox.vnpayment.vn", { args: { btnText } }, ({ btnText }) => {
    cy.on("uncaught:exception", () => false);
    cy.wait(1000);
    cy.get("#btnContinue", { timeout: 15000 }).click({ force: true });
  });
});

When(
  "người dùng nhấn {string} trên hộp thoại điều khoản VNPay",
  (btnText) => {
    cy.origin(
      "https://sandbox.vnpayment.vn",
      { args: { btnText } },
      ({ btnText }) => {
        cy.on("uncaught:exception", () => false);
        cy.wait(1500);

        // DOM click trực tiếp (vượt qua vấn đề visibility của modal)
        cy.window().then((win) => {
          const btn = win.document.getElementById("btnAgree");
          if (btn) {
            btn.dispatchEvent(
              new MouseEvent("click", { bubbles: true, cancelable: true })
            );
          }
        });

        // Fallback qua cy.get nếu DOM click chưa đủ
        cy.get("body").then(($body) => {
          if ($body.find("#btnAgree").length > 0) {
            cy.get("#btnAgree").click({ force: true });
          }
        });
      }
    );
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 4: NHẬP MÃ OTP VÀ THANH TOÁN
// ═══════════════════════════════════════════════════════════════════════════════

When("người dùng nhập mã OTP xác thực {string} trên cổng VNPay", (otpCode) => {
  cy.origin(
    "https://sandbox.vnpayment.vn",
    { args: { otpCode } },
    ({ otpCode }) => {
      cy.on("uncaught:exception", () => false);

      cy.get(
        "#otpvalue, input[name='otpvalue'], input[placeholder*='OTP'], input[placeholder*='otp']",
        { timeout: 30000 }
      )
        .filter(":visible")
        .first()
        .clear({ force: true })
        .type(otpCode, { delay: 30, force: true });
    }
  );
});

When("người dùng nhấn nút {string} để hoàn tất giao dịch", (_btnText) => {
  cy.origin("https://sandbox.vnpayment.vn", () => {
    cy.on("uncaught:exception", () => false);
    cy.get("#btnConfirm", { timeout: 15000 }).click({ force: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 5: CALLBACK QUAY VỀ WEB VÀ HIỂN THỊ KẾT QUẢ THÀNH CÔNG
// ═══════════════════════════════════════════════════════════════════════════════

Then("hệ thống tự động quay trở lại trang web 8ThreadsEvent", () => {
  cy.url({ timeout: 35000 }).should("include", "http://localhost:3000");
  cy.url().should("include", "/page/payment/return");
});

Then("màn hình hiển thị kết quả {string}", (expectedMessage) => {
  cy.contains(new RegExp(expectedMessage, "i"), { timeout: 20000 }).should(
    "be.visible"
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC_PAY_02: Unhappy Path — Chưa tích checkbox Điều khoản
// ═══════════════════════════════════════════════════════════════════════════════

When("Người dùng KHÔNG tích chọn điều khoản và điều kiện", () => {
  // Đảm bảo checkbox KHÔNG được check
  cy.get('input[type="checkbox"]').uncheck({ force: true });
});

Then("Nút thanh toán bị vô hiệu hóa hoặc hệ thống báo lỗi chưa đồng ý điều khoản", () => {
  cy.get("body").then(($body) => {
    const $btn = $body.find('button:contains("Thanh Toán"), button:contains("THANH TOÁN")');
    if ($btn.length > 0 && $btn.prop("disabled")) {
      // Nút bị disabled — Pass
      cy.wrap($btn.first()).should("be.disabled");
    } else {
      // Nút vẫn click được → kiểm tra thông báo lỗi điều khoản
      cy.contains("button", /Thanh Toán/i).click();
      cy.contains(
        /điều khoản|đồng ý|terms/i,
        { timeout: 5000 }
      ).should("be.visible");
      // Không redirect sang /page/payment
      cy.url().should("not.include", "/page/payment?orderId=");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC_PAY_03: Unhappy Path — Sai định dạng SĐT
// ═══════════════════════════════════════════════════════════════════════════════

When(
  "Người dùng nhập họ tên {string} và số điện thoại không hợp lệ {string}",
  (fullName, invalidPhone) => {
    cy.get('input[placeholder*="họ và tên"]').clear().type(fullName);
    cy.get('input[placeholder*="số điện thoại"]').clear().type(invalidPhone);
  }
);

Then("Hệ thống hiển thị thông báo lỗi số điện thoại không hợp lệ", () => {
  cy.contains(
    /số điện thoại không hợp lệ|phone.*invalid|sdt.*sai/i,
    { timeout: 5000 }
  ).should("be.visible");
});

Then("URL checkout không thay đổi — không redirect sang trang thanh toán", () => {
  cy.url().should("include", "/page/checkout");
  cy.url().should("not.include", "/page/payment?orderId=");
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC_PAY_04: Unhappy Path — Sai thẻ NCB trên cổng VNPay
// ═══════════════════════════════════════════════════════════════════════════════

When("người dùng nhập thông tin thẻ NCB sai:", (dataTable) => {
  const { cardNumber, cardHolder, issueDate } = dataTable.rowsHash();

  cy.origin(
    "https://sandbox.vnpayment.vn",
    { args: { cardNumber, cardHolder, issueDate } },
    ({ cardNumber, cardHolder, issueDate }) => {
      cy.on("uncaught:exception", () => false);

      cy.get("#card_number_mask, input[name='card_number_mask']", { timeout: 20000 })
        .filter(":visible")
        .first()
        .clear({ force: true })
        .type(cardNumber, { delay: 30, force: true });

      cy.get("#cardHolder, input[name='cardHolder']", { timeout: 10000 })
        .filter(":visible")
        .first()
        .clear({ force: true })
        .type(cardHolder, { delay: 30, force: true });

      cy.get("#cardDate, input[name='cardDate']", { timeout: 10000 })
        .filter(":visible")
        .first()
        .clear({ force: true })
        .type(issueDate, { delay: 30, force: true });
    }
  );
});

Then("cổng VNPay hiển thị thông báo lỗi thẻ không hợp lệ hoặc hết hạn", () => {
  cy.origin("https://sandbox.vnpayment.vn", () => {
    cy.on("uncaught:exception", () => false);
    // Kiểm tra thông báo lỗi xuất hiện sau khi bấm Tiếp tục với thẻ sai
    cy.contains(
      /không hợp lệ|invalid|lỗi|error|thẻ.*hết hạn|expired/i,
      { timeout: 15000 }
    ).should("be.visible");
    // Không chuyển sang màn OTP (không có trường #otpvalue)
    cy.get("#otpvalue").should("not.exist");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC_PAY_05: Unhappy Path — Sai OTP xác thực
// ═══════════════════════════════════════════════════════════════════════════════

When("người dùng nhập mã OTP sai {string} trên cổng VNPay", (wrongOtp) => {
  cy.origin(
    "https://sandbox.vnpayment.vn",
    { args: { wrongOtp } },
    ({ wrongOtp }) => {
      cy.on("uncaught:exception", () => false);

      cy.get(
        "#otpvalue, input[name='otpvalue'], input[placeholder*='OTP'], input[placeholder*='otp']",
        { timeout: 30000 }
      )
        .filter(":visible")
        .first()
        .clear({ force: true })
        .type(wrongOtp, { delay: 30, force: true });
    }
  );
});

Then("cổng VNPay hiển thị thông báo lỗi OTP không hợp lệ", () => {
  cy.origin("https://sandbox.vnpayment.vn", () => {
    cy.on("uncaught:exception", () => false);
    // Sau khi bấm Thanh toán với OTP sai, VNPay báo lỗi OTP
    cy.contains(
      /otp.*không hợp lệ|otp.*sai|otp.*invalid|mã xác thực.*sai|wrong otp/i,
      { timeout: 20000 }
    ).should("be.visible");
    // Không redirect về localhost (không thanh toán thành công)
    cy.url().should("not.include", "localhost:3000");
  });
});
