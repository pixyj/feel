export NODE_PATH=app/base/js
#watchify -t reactify --debug main.js -x jquery -x underscore -x backbone -x react -x react-dom -o dist/bundle.js
watchify -t reactify --debug main.js -x jquery -x underscore -x backbone -x react -x react-dom -o dist/bundle.js
