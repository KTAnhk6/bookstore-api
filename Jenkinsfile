pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                // Tải mã nguồn mới nhất từ nhánh main
                checkout scm 
            }
        }
        stage('Restore') {
            steps {
                // Khôi phục thư viện NuGet
                bat 'dotnet restore' 
            }
        }
        stage('Build') {
            steps {
                // Biên dịch dự án ở chế độ Release
                bat 'dotnet build --configuration Release --no-restore' 
            }
        }
        stage('Test') {
            steps {
                // Chạy các bài kiểm thử tự động[cite: 3]
                bat 'dotnet test --no-build --verbosity normal' 
            }
        }
        stage('Publish') {
            steps {
                // Xuất bản ứng dụng ASP.NET Core[cite: 3]
                bat 'dotnet publish --configuration Release --output ./publish' 
            }
        }
        stage('Deploy') {
            steps {
                // Sao chép bản publish vào thư mục IIS C:\wwwroot\webbanhang[cite: 3, 4]
                // Sử dụng app_offline.htm để tạm ngừng ứng dụng khi cập nhật file DLL theo lưu ý kỹ thuật[cite: 5]
                bat '''
                    if not exist "C:\\wwwroot\\webbanhang" mkdir "C:\\wwwroot\\webbanhang"
                    echo "Đang cap nhat..." > C:\\wwwroot\\webbanhang\\app_offline.htm
                    xcopy /y /s /i ".\\publish\\*" "C:\\wwwroot\\webbanhang\\"
                    del C:\\wwwroot\\webbanhang\\app_offline.htm
                '''
            }
        }
        stage('Verify') {
            steps {
                // Kiểm tra ứng dụng sau triển khai[cite: 3]
                echo 'Triển khai lên IIS thành công. Vui lòng truy cập http://localhost/webbanhang để kiểm tra.'
            }
        }
    }
    post {
        failure {
            // Nếu xảy ra lỗi tại bước Build hoặc Test, Jenkins dừng quy trình và không triển khai[cite: 3]
            echo 'Pipeline thất bại. Dừng quy trình triển khai để bảo vệ phiên bản hiện tại trên IIS.'
        }
    }
}
