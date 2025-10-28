pipeline {
    agent any
    environment {
        DOCKER_USERNAME = "vovanluan2953"
        IMAGE_NAME = "webnoithat"
    }
    
    triggers {
        pollSCM('H/5 * * * *')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo ✅ Repository checked out'
            }
        }

        stage('Clean Docker Cache') {
            steps {
                bat """
                    echo 🧹 Cleaning Docker cache...
                    docker system prune -f || echo "No need to clean"
                    docker rmi %DOCKER_USERNAME%/%IMAGE_NAME%:latest 2>nul || echo "Image not found, continuing..."
                """
            }
        }

        stage('Docker Build') {
            steps {
                bat """
                    echo 🏗️ Building Docker image...
                    docker build --no-cache -t %DOCKER_USERNAME%/%IMAGE_NAME%:latest .
                    echo ✅ Docker build completed
                """
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKER_USER', 
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat """
                        echo 🔐 Logging into Docker Hub...
                        echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                        echo ✅ Login exit code: %ERRORLEVEL%
                    """
                }
            }
        }

        stage('Push Docker Hub') {
            steps {
                bat """
                    echo 📤 Pushing image to Docker Hub...
                    docker push %DOCKER_USERNAME%/%IMAGE_NAME%:latest
                    echo ✅ Image pushed successfully!
                """
            }
        }

        stage('Deploy Notification') {
            steps {
                bat """
                    echo ========================================
                    echo 🚀 DEPLOYMENT SUCCESSFUL!
                    echo ========================================
                    echo 📦 Image: %DOCKER_USERNAME%/%IMAGE_NAME%:latest
                    echo 🔄 Render auto-deploying...
                    echo 🌐 Live: https://webnoithat.onrender.com
                    echo ========================================
                """
            }
        }
    }
    
    post {
        always {
            bat 'docker logout || echo "Already logged out"'
            bat 'echo 🕒 Pipeline completed at %TIME%'
        }
        success {
            bat 'echo 🎉 DEPLOYMENT SUCCESSFUL!'
        }
        failure {
            bat 'echo ❌ DEPLOYMENT FAILED'
        }
    }
}