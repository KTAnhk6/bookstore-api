pipeline {
    agent any

    options {
        // Tự động xoá các bản build cũ, chỉ giữ lại 10 lần gần nhất để tránh đầy ổ cứng
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Ngăn chặn 2 bản build chạy đè lên nhau
        disableConcurrentBuilds()
    }

    stages {
        stage('1. Checkout') {
            steps {
                echo 'Cleaning workspace and fetching code...'
                deleteDir()       // Xóa sạch file rác của lần build trước
                checkout scm      // Kéo code mới nhất từ GitHub
                bat 'git log -1 --oneline'
            }
        }

        stage('2. Environment Check') {
            steps {
                echo 'Checking Java environment...'
                bat 'java -version'
            }
        }

        stage('3. Build & Test') {
            steps {
                echo 'Building and running tests...'
                // Dùng mvnw.cmd có sẵn trong repo, biên dịch và chạy unit test
                bat 'mvnw.cmd clean package'
            }
            post {
                always {
                    // Tự động thu thập báo cáo kết quả test
                    junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('4. Archive Artifacts') {
            steps {
                echo 'Archiving JAR file...'
                // Lưu lại file .jar vào Jenkins để có thể tải về trực tiếp từ giao diện web
                archiveArtifacts artifacts: 'target/*.jar', allowEmptyArchive: false, fingerprint: true
            }
        }
    }

    post {
        success {
            echo '========================================='
            echo 'CI SUCCESS: Build & Unit Test thành công!'
            echo '========================================='
        }
        failure {
            echo '========================================='
            echo 'CI FAILED: Vui lòng kiểm tra Console Log!'
            echo '========================================='
        }
        always {
            echo "Hoàn tất Job: ${env.JOB_NAME} - Lần build: #${env.BUILD_NUMBER}"
        }
    }
}
