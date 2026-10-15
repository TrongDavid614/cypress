Feature: Chức năng đăng nhập hệ thống 8ThreadsEvent
  Là một người dùng của hệ thống 8ThreadsEvent
  Tôi muốn có thể đăng nhập bằng tài khoản của mình
  Để sử dụng các tính năng đặt vé và quản lý đơn hàng

  Scenario: Đăng nhập thành công với tài khoản hợp lệ (Happy Path)
    Given Người dùng truy cập trang đăng nhập "/page/login"
    When Người dùng nhập thông tin đăng nhập hợp lệ từ fixture "user_data.json"
    And Người dùng nhấn nút "LOGIN"
    Then Hệ thống thông báo đăng nhập thành công
    And Người dùng được chuyển hướng đến trang mua vé "/page/concerts"
    And Màn hình kết thúc tải và chữ "LOADING..." biến mất
    And Nút đăng nhập không còn hiển thị trên thanh điều hướng
    And Thanh điều hướng hiển thị tên người dùng "Test Account"
    And Danh sách sự kiện được hiển thị thành công

  Scenario: Đăng nhập thất bại khi nhập sai mật khẩu (Unhappy Path)
    Given Người dùng truy cập trang đăng nhập "/page/login"
    When Người dùng nhập thông tin đăng nhập không hợp lệ từ fixture "user_data.json"
    And Người dùng nhấn nút "LOGIN"
    Then Hệ thống hiển thị thông báo lỗi "Sai tài khoản hoặc mật khẩu"
    And Người dùng vẫn ở lại trang đăng nhập

  Scenario: Đăng nhập thất bại khi email không tồn tại trong hệ thống (Unhappy Path)
    Given Người dùng truy cập trang đăng nhập "/page/login"
    When Người dùng nhập email "nouser@notexist.com" và mật khẩu "12345678"
    And Người dùng nhấn nút "LOGIN"
    Then Hệ thống hiển thị thông báo lỗi "Sai tài khoản hoặc mật khẩu"
    And Người dùng vẫn ở lại trang đăng nhập

  Scenario: Báo lỗi validation khi để trống Email và Mật khẩu (Validation)
    Given Người dùng truy cập trang đăng nhập "/page/login"
    When Người dùng không nhập gì và bấm nút "LOGIN"
    Then Hệ thống chặn submit và hiển thị lỗi trường bắt buộc
    And Người dùng vẫn ở lại trang đăng nhập
