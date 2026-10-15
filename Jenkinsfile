pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Lấy mã nguồn mới nhất từ GitHub
                checkout scm
            }
        }
        stage('Build & Test') {
            steps {
                // Dọn dẹp bản build cũ, tải thư viện, biên dịch và chạy test tự động
                bat 'mvnw.cmd clean package'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Đang triển khai ứng dụng...'
                // Lệnh chạy ứng dụng mô phỏng. Khi build xong, Maven thường tạo ra file .jar trong thư mục target.
                // Tùy thuộc vào cấu hình pom.xml, bạn có thể bỏ comment lệnh dưới và sửa tên file .jar cho đúng để Jenkins tự động chạy app.
                // bat 'start /b java -jar target/tên-file-app-của-bạn.jar'
            }
        }
    }
    post {
        always {
            echo 'Quy trình CI/CD đã hoàn tất.'
        }
    }
}
