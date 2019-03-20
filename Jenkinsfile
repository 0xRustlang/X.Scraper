node {
    def app
    checkout scm

    stage('Build image') {
        app = docker.build("firexproxy/x.scraper:${env.BUILD_ID}")
    }

    stage('Push image') {
        docker.withRegistry("https://docker.firexproxy.com", "deploy") {
            app.push()
        }
    }

    stage('Deploy image') {
        def environments = env.getEnvironment().findAll { name, value -> name in ["XMETER_HOST", "XMETER_USERNAME", "XMETER_PASSWORD", "DB_HOST", "DB_NAME", "DB_USER", "DB_PASS", "INFLUXDB_USERNAME", "INFLUXDB_PASSWORD", "INFLUXDB_DATABASE", "INFLUXDB_HOST", "INFLUXDB_PORT"] }.collect{ name, value -> "${name}=${value}" }.join("\n")

        withCredentials([usernamePassword(credentialsId: 'deploy', passwordVariable: 'C_PASSWORD', usernameVariable: 'C_USER')]) {
            sh "ssh -o StrictHostKeyChecking=no -t arcsin@firexproxy.com -p2244 'echo -e \"${environments}\" > .env && docker stop xscraper || true && docker login -u ${C_USER} -p ${C_PASSWORD} docker.firexproxy.com && docker pull docker.firexproxy.com/firexproxy/x.scraper:${env.BUILD_ID} && docker run -d --rm -p 60000:4040 --env-file .env --name xscraper docker.firexproxy.com/firexproxy/x.scraper:${env.BUILD_ID} && rm -f ~/.env'"
        }
    }
}

