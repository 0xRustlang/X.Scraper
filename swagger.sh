docker run --rm -v ${PWD}:/local swaggerapi/swagger-codegen-cli generate -i /local/xmeterapi/swagger.yml -l typescript-node -o /local/src/xmeterapi/
docker run --rm -v ${PWD}:/local swaggerapi/swagger-codegen-cli generate -i /local/xscraperapi/swagger.yml -l nodejs-server -o /local/src/xscraperapi/

