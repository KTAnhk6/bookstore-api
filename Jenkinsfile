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
                docker rm -f bookstore-api 2>nul
                docker compose --env-file C:\\Monitoring\\bookstore.env up -d --build
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
