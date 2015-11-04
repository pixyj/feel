export NODE_PATH=app/base/js
watchify -t reactify --debug main.js --ignore lapack -o dist/bundle.js
