./compass-compile-vendor.sh
./compass-compile-app.sh
./browserify-app.sh
gulp minify
./create-commit-suffix-files.sh 
python create_deployment_payload.py --commit=`git rev-parse HEAD` -z /Users/pramod/Dropbox/Public/feel-client
