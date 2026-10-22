pipeline {
    agent any // hoặc agent { label 'windows-java21' }

    triggers {
        githubPush()
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        JAVA_HOME = 'C:\\Program Files\\Java\\jdk-21' // đường dẫn JDK trên agent
    }

    stages {
        stage('1. Checkout') {
            steps {
                deleteDir()
                checkout scm
                bat 'git log -1 --oneline'
            }
        }

        stage('2. Environment Check') {
            steps {
                bat 'java -version'
            }
        }

        stage('3. Compile') {
            steps {
                // Chỉ compile mã nguồn để kiểm tra lỗi cú pháp
                bat 'mvnw.cmd clean compile'
            }
        }

        stage('4. Unit Test') {
            steps {
                // Chạy test tự động
                bat 'mvnw.cmd test'
            }
            post {
                always {
                    // Thu thập báo cáo test JUnit của Maven
                    junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('5. Package') {
            steps {
                // Đóng gói ra file jar (bỏ qua chạy lại test vì stage 4 đã test rồi)
                bat 'mvnw.cmd package -DskipTests'
            }
        }

        stage('6. Archive Artifacts') {
            steps {
                // Lưu trữ file .jar lên Jenkins
                archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
            }
        }
    }

    post {
        success { echo '=== BUILD & TEST SUCCESSFUL ===' }
        failure { echo '=== BUILD FAILED: KIỂM TRA CONSOLE OUTPUT ===' }
        always  { echo "Hoàn tất build: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }
    }
}
