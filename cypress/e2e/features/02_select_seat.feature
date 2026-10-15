Feature: Chức năng chọn vé và vị trí ghế sự kiện
  Là một khán giả tham gia sự kiện
  Tôi muốn xem chi tiết sự kiện và chọn loại vé trên sơ đồ
  Để hệ thống giữ vé và chuyển sang bước thanh toán

  Scenario: Chọn hạng vé sự kiện và xác nhận đặt vé thành công (Happy Path)
    Given Người dùng đã đăng nhập vào hệ thống bằng tài khoản "user_data.json"
    When Người dùng truy cập trang chi tiết sự kiện "/page/viewticket/69cfe41cead085d554b55e55"
    And Người dùng bấm nút "Mua ngay" để chuyển sang sơ đồ chọn ghế
    Then Hệ thống điều hướng đến trang chọn ghế "/page/selectSeat/69cfe41cead085d554b55e55"
    When Người dùng chọn khu vực ghế trên sơ đồ sự kiện
    Then Giỏ vé hiển thị thông tin vé đã chọn với số lượng ban đầu là 1
    When Người dùng tăng số lượng vé bằng nút "+"
    Then Giỏ vé cập nhật số lượng vé là 2 và tính đúng tổng tiền
    When Người dùng bấm nút "Xác nhận"
    Then Modal xác nhận đơn hàng hiển thị với thông báo "Xác nhận đơn hàng"
    When Người dùng bấm nút "Tiếp tục" trên modal
    Then Hệ thống chuyển hướng đến trang checkout

  Scenario: Không cho phép chọn khu vực ghế đã bán hết hoặc bị khóa (Unhappy Path)
    Given Người dùng đã đăng nhập vào hệ thống bằng tài khoản "user_data.json"
    When Người dùng truy cập trang chọn ghế trực tiếp "/page/selectSeat/69cfe41cead085d554b55e55"
    Then Hệ thống điều hướng đến trang chọn ghế "/page/selectSeat/69cfe41cead085d554b55e55"
    When Người dùng click vào khu vực ghế đã bán hoặc bị vô hiệu hóa
    Then Giỏ vé không thay đổi — số lượng vé vẫn là 0
    And Nút "Xác nhận" bị vô hiệu hóa hoặc không xuất hiện

  Scenario: Chặn tăng số lượng vé vượt quá giới hạn tối đa maxQty = 10 (BVA)
    Given Người dùng đã đăng nhập vào hệ thống bằng tài khoản "user_data.json"
    When Người dùng truy cập trang chọn ghế trực tiếp "/page/selectSeat/69cfe41cead085d554b55e55"
    Then Hệ thống điều hướng đến trang chọn ghế "/page/selectSeat/69cfe41cead085d554b55e55"
    When Người dùng chọn khu vực ghế trên sơ đồ sự kiện
    And Người dùng tăng số lượng vé đến giới hạn tối đa 10 vé
    Then Giỏ vé hiển thị đúng 10 vé và tổng tiền 6.000.000đ
    And Nút tăng số lượng bị vô hiệu hóa khi đã đạt maxQty

  Scenario: Không thể bấm xác nhận khi chưa chọn bất kỳ vị trí ghế nào (Validation)
    Given Người dùng đã đăng nhập vào hệ thống bằng tài khoản "user_data.json"
    When Người dùng truy cập trang chọn ghế trực tiếp "/page/selectSeat/69cfe41cead085d554b55e55"
    Then Hệ thống điều hướng đến trang chọn ghế "/page/selectSeat/69cfe41cead085d554b55e55"
    And Giỏ vé trống — chưa có vé nào được chọn
    Then Nút "Xác nhận" bị vô hiệu hóa hoặc không xuất hiện
