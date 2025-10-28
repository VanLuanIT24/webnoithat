pipeline {
    agent any
    environment {
        DOCKER_USERNAME = "xiaoyingliu"
        IMAGE_NAME = "webnoithat"
    }
    
    triggers {
        pollSCM('H/5 * * * *')  // Kiểm tra mỗi 5 phút
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/VanLuanIT24/webnoithat.git',
                        credentialsId: 'github-pat'
                    ]]
                ])
            }
        }

        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKER_USER', 
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat "docker build -t ${env.DOCKER_USERNAME}/${env.IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKER_USER', 
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat "echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin"
                }
            }
        }

        stage('Push Docker Hub') {
            steps {
                bat "docker push ${env.DOCKER_USERNAME}/${env.IMAGE_NAME}:latest"
            }
        }

        stage('Deploy Notification') {
            steps {
                bat """
                    echo ✅ Docker Image đã được push lên Docker Hub
                    echo 🔄 Render sẽ tự động deploy từ image mới...
                    echo 📱 Kiểm tra tiến trình tại: https://dashboard.render.com
                    echo 🌐 Ứng dụng: https://webnoithat.onrender.com
                """
            }
        }
    }
    
    post {
        always {
            bat "docker logout"
            bat "echo Pipeline completed at %DATE% %TIME%"
        }
        success {
            bat "echo 🎉 DEPLOYMENT SUCCESSFUL!"
        }
        failure {
            bat "echo ❌ DEPLOYMENT FAILED - Check logs above"
        }
    }
}