pipeline {
    agent { label 'windows' }
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
        skipDefaultCheckout(true)
    }

    stages {
        stage('1. Checkout') {
            steps {
                deleteDir()
                checkout scm
                bat 'git log -1 --oneline'
            }
        }

        stage('2. Build JAR - tests skipped') {
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
                docker compose --env-file C:\\Monitoring\\bookstore.env build
                if errorlevel 1 exit /b 1
                docker compose --env-file C:\\Monitoring\\bookstore.env up -d --no-build
                if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('5. Verify HTTP') {
            steps {
                powershell '''
                    $deadline = (Get-Date).AddMinutes(3)
                    do {
                        try {
                            $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8085/api/books?size=1' -TimeoutSec 5
                            $body = $r.Content | ConvertFrom-Json
                            if ($r.StatusCode -eq 200 -and $body.success -eq $true) {
                                Write-Output 'API verified: HTTP 200 and success=true'
                                exit 0
                            }
                        } catch { }
                        Start-Sleep -Seconds 5
                    } while ((Get-Date) -lt $deadline)
                    throw 'API failed verification within 3 minutes'
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
