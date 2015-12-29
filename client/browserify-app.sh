export NODE_PATH=app/base/js
browserify -t reactify main.js -x jquery -x underscore -x backbone -x react -x react-dom -o dist/app.js
