pipeline {
    agent any
    environment {
        DOCKER_USERNAME = "XiaoYingLiu"
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
                    sh "docker build -t ${env.DOCKER_USERNAME}/${env.IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKER_USER', 
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    sh "docker push ${env.DOCKER_USERNAME}/${env.IMAGE_NAME}:latest"
                }
            }
        }

        stage('Trigger Render Deploy') {
            steps {
                sh """
                    echo "✅ Docker Image đã được push lên Docker Hub"
                    echo "🔄 Render sẽ tự động deploy từ image mới..."
                    echo "📱 Kiểm tra tiến trình tại: https://dashboard.render.com"
                """
            }
        }
    }
    
    post {
        always {
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