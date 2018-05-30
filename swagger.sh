docker run --rm -v ${PWD}:/local swaggerapi/swagger-codegen-cli generate -i /local/openapi/swagger.yml -l typescript-node -o /local/src/generated/

