pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('1. Checkout') {
            steps {
                deleteDir()
                checkout scm
                bat 'git log -1 --oneline'
            }
        }

        stage('2. Build & Test') {
            steps {
                bat 'mvnw.cmd clean package -DskipTests'
            }
        }

        stage('3. Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: 'target/*.jar', allowEmptyArchive: false, fingerprint: true
            }
        }

        stage('4. Docker CD Deploy') {
            steps {
                bat '''
                docker build -t bookstore-api .
                docker stop bookstore-api 2>nul || exit 0
                docker rm -f bookstore-api 2>nul || exit 0
                docker run -d --name bookstore-api -p 8085:8080 -e SPRING_DATASOURCE_URL="jdbc:mysql://172.23.176.1:3306/bookstore?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true" -e SPRING_DATASOURCE_USERNAME=bookstore_user -e SPRING_DATASOURCE_PASSWORD=*** bookstore-api
                '''
            }
        }
    }

    post {
        success {
            echo "CI/CD SUCCESS: API live tai http://160.191.244.100:8085"
        }
        failure {
            echo "CI/CD FAILED: Kiem tra Console Log!"
        }
    }
}
