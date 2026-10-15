Feature: Luồng thanh toán VNPAY — Đặt vé, xác nhận đơn hàng & Thanh toán qua thẻ NCB Sandbox
  Là một khách hàng mua vé sự kiện trên 8ThreadsEvent
  Tôi muốn điền thông tin người nhận, tạo đơn hàng VNPAY và thanh toán qua thẻ NCB
  Để hoàn tất đơn hàng và nhận vé điện tử hợp lệ trong một luồng nghiệp vụ liền mạch

  # ─── TC_PAY_01: Happy Path trọn vẹn ──────────────────────────────────────
  Scenario: Đặt vé, xác nhận đơn hàng và thanh toán thành công qua cổng VNPay Sandbox
    # ── Bước 1: Chuẩn bị thông tin đơn hàng tại trang checkout ──
    Given Người dùng đã đăng nhập và có giỏ vé hợp lệ trong hệ thống
    When Người dùng truy cập trang checkout sự kiện "e001"
    And Người dùng tích chọn đồng ý "Điều khoản và điều kiện"
    And Người dùng nhập họ tên "Nguyen Van A" và số điện thoại "0988000000"
    And Người dùng chọn phương thức thanh toán "VNPAY/Ứng dụng ngân hàng"
    And Người dùng nhấn nút xác nhận thanh toán trên trang checkout

    # ── Bước 2: Xác nhận trang thanh toán và chuyển sang VNPay Sandbox ──
    Then Hệ thống chuyển hướng đến trang thanh toán chứa tham số "orderId"
    And Trang thanh toán hiển thị tiêu đề "Thông tin đơn hàng"
    When người dùng nhấn chuyển hướng sang cổng thanh toán VNPay
    Then trình duyệt chuyển hướng đến cổng thanh toán VNPay Sandbox

    # ── Bước 3: Điền thẻ NCB, tiếp tục và đồng ý điều khoản ──
    When người dùng nhập thông tin thẻ test NCB:
      | cardNumber | 9704198526191432198 |
      | cardHolder | NGUYEN VAN A        |
      | issueDate  | 07/15               |
    And người dùng nhấn nút "Tiếp tục" trên cổng VNPay
    And người dùng nhấn "Đồng ý & Tiếp tục" trên hộp thoại điều khoản VNPay

    # ── Bước 4: Nhập mã OTP và hoàn tất thanh toán ──
    And người dùng nhập mã OTP xác thực "123456" trên cổng VNPay
    And người dùng nhấn nút "Thanh toán" để hoàn tất giao dịch

    # ── Bước 5: Callback quay về hệ thống và kiểm tra kết quả ──
    Then hệ thống tự động quay trở lại trang web 8ThreadsEvent
    And màn hình hiển thị kết quả "Thanh toán thành công"

  # ─── TC_PAY_02: Unhappy Path — Chưa tích điều khoản ─────────────────────
  Scenario: Chặn thanh toán khi chưa tích đồng ý điều khoản và điều kiện (Unhappy Path)
    Given Người dùng đã đăng nhập và có giỏ vé hợp lệ trong hệ thống
    When Người dùng truy cập trang checkout sự kiện "e001"
    And Người dùng nhập họ tên "Nguyen Van A" và số điện thoại "0988000000"
    And Người dùng chọn phương thức thanh toán "VNPAY/Ứng dụng ngân hàng"
    And Người dùng KHÔNG tích chọn điều khoản và điều kiện
    Then Nút thanh toán bị vô hiệu hóa hoặc hệ thống báo lỗi chưa đồng ý điều khoản

  # ─── TC_PAY_03: Unhappy Path — Sai định dạng SĐT ─────────────────────────
  Scenario: Báo lỗi validation khi nhập sai định dạng số điện thoại (Unhappy Path)
    Given Người dùng đã đăng nhập và có giỏ vé hợp lệ trong hệ thống
    When Người dùng truy cập trang checkout sự kiện "e001"
    And Người dùng tích chọn đồng ý "Điều khoản và điều kiện"
    And Người dùng nhập họ tên "Nguyen Van A" và số điện thoại không hợp lệ "0988abc"
    And Người dùng chọn phương thức thanh toán "VNPAY/Ứng dụng ngân hàng"
    And Người dùng nhấn nút xác nhận thanh toán trên trang checkout
    Then Hệ thống hiển thị thông báo lỗi số điện thoại không hợp lệ
    And URL checkout không thay đổi — không redirect sang trang thanh toán

  # ─── TC_PAY_04: Unhappy Path — Sai thẻ NCB trên cổng VNPay ──────────────
  Scenario: Giao dịch thất bại khi nhập sai thông tin thẻ NCB trên cổng VNPay (Unhappy Path)
    Given Người dùng đã đăng nhập và có giỏ vé hợp lệ trong hệ thống
    When Người dùng truy cập trang checkout sự kiện "e001"
    And Người dùng tích chọn đồng ý "Điều khoản và điều kiện"
    And Người dùng nhập họ tên "Nguyen Van A" và số điện thoại "0988000000"
    And Người dùng chọn phương thức thanh toán "VNPAY/Ứng dụng ngân hàng"
    And Người dùng nhấn nút xác nhận thanh toán trên trang checkout
    Then Hệ thống chuyển hướng đến trang thanh toán chứa tham số "orderId"
    When người dùng nhấn chuyển hướng sang cổng thanh toán VNPay
    Then trình duyệt chuyển hướng đến cổng thanh toán VNPay Sandbox
    When người dùng nhập thông tin thẻ NCB sai:
      | cardNumber | 9704000000000000 |
      | cardHolder | NGUYEN VAN A     |
      | issueDate  | 01/10            |
    And người dùng nhấn nút "Tiếp tục" trên cổng VNPay
    Then cổng VNPay hiển thị thông báo lỗi thẻ không hợp lệ hoặc hết hạn

  # ─── TC_PAY_05: Unhappy Path — Sai OTP xác thực ─────────────────────────
  Scenario: Giao dịch thất bại khi nhập sai mã OTP xác thực trên cổng VNPay (Unhappy Path)
    Given Người dùng đã đăng nhập và có giỏ vé hợp lệ trong hệ thống
    When Người dùng truy cập trang checkout sự kiện "e001"
    And Người dùng tích chọn đồng ý "Điều khoản và điều kiện"
    And Người dùng nhập họ tên "Nguyen Van A" và số điện thoại "0988000000"
    And Người dùng chọn phương thức thanh toán "VNPAY/Ứng dụng ngân hàng"
    And Người dùng nhấn nút xác nhận thanh toán trên trang checkout
    Then Hệ thống chuyển hướng đến trang thanh toán chứa tham số "orderId"
    When người dùng nhấn chuyển hướng sang cổng thanh toán VNPay
    Then trình duyệt chuyển hướng đến cổng thanh toán VNPay Sandbox
    When người dùng nhập thông tin thẻ test NCB:
      | cardNumber | 9704198526191432198 |
      | cardHolder | NGUYEN VAN A        |
      | issueDate  | 07/15               |
    And người dùng nhấn nút "Tiếp tục" trên cổng VNPay
    And người dùng nhấn "Đồng ý & Tiếp tục" trên hộp thoại điều khoản VNPay
    And người dùng nhập mã OTP sai "000000" trên cổng VNPay
    And người dùng nhấn nút "Thanh toán" để hoàn tất giao dịch
    Then cổng VNPay hiển thị thông báo lỗi OTP không hợp lệ
