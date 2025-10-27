pipeline {
    agent any
    environment {
        DOCKER_USERNAME = "XiaoYingLiu"
        IMAGE_NAME = "webnoithat"
        // KHÔNG CẦN SERVER_HOST VÀ SERVER_USER NỮA
    }
    stages {
        // Bước 1: Lấy code từ GitHub
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

        // Bước 2: Build Docker Image
        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred',
                                usernameVariable: 'DOCKER_USER', 
                                passwordVariable: 'DOCKER_PASS')]) {
                    sh "docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}:latest ."
                }
            }
        }

        // Bước 3: Push Image lên Docker Hub
        stage('Push Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred',
                                usernameVariable: 'DOCKER_USER', 
                                passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    sh "docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
                }
            }
        }

        // Bước 4: Trigger Render Deploy (MỚI)
        stage('Trigger Render Deploy') {
            steps {
                sh """
                    echo "✅ Docker Image đã được push lên Docker Hub"
                    echo "🔄 Render sẽ tự động deploy từ Docker Hub..."
                    echo "📱 Kiểm tra tiến trình tại: https://dashboard.render.com"
                """
            }
        }
    }
    
    post {
        always {
            // Cleanup
            sh 'docker logout'
        }
        success {
            sh """
                echo "🎉 DEPLOY THÀNH CÔNG!"
                echo "🌐 Ứng dụng của bạn đang chạy tại: https://webnoithat.onrender.com"
            """
        }
    }
}