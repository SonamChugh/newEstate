node {
    checkout scm

    String branchName = "${env.BRANCH_NAME}".toLowerCase().replaceAll('/', '_').replaceAll('-', '_')
    String imageName = "white/we-web-${branchName}:1.0.${env.BUILD_ID}"

    docker.withRegistry("${env.DOCKER_REGISTRY_URL}") {
      def customImage = docker.build(imageName, ".")
      customImage.push()
      customImage.push('latest')
    }

    build job: "build-branch-trigger", parameters: [
        [ $class: 'StringParameterValue', name: 'PROJECT_NAME', value: 'we-web' ],
        [ $class: 'StringParameterValue', name: 'BRANCH_NAME', value: env.BRANCH_NAME ]
    ]
}
