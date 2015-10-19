export NODE_PATH=app/base/js
watchify -t reactify --debug main.js -o dist/bundle.js
