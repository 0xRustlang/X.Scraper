docker run --rm -v ${PWD}:/local swaggerapi/swagger-codegen-cli generate \
    -i /local/openapi/swagger.yml \
    -l javascript \
    --additional-properties usePromises=true,useES6=false \
    -o /local/generated/

