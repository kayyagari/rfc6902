BIN := node_modules/.bin
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)

all: clean $(TYPESCRIPT:%.ts=%.js) $(TYPESCRIPT:%.ts=%.d.ts) scim-rfc6902.js scim-rfc6902.min.js .npmignore .gitignore

clean:
	rm *.js

$(BIN)/browserify $(BIN)/mocha $(BIN)/tsc $(BIN)/istanbul $(BIN)/_mocha $(BIN)/coveralls:
	npm install

.npmignore: tsconfig.json
	echo $(TYPESCRIPT) .travis.yml Makefile tsconfig.json tests/ coverage/ | tr ' ' '\n' > $@

.gitignore: tsconfig.json
	echo $(TYPESCRIPT:%.ts=%.js) $(TYPESCRIPT:%.ts=%.d.ts) coverage/ | tr ' ' '\n' > $@

%.js %.d.ts: %.ts $(BIN)/tsc
	$(BIN)/tsc

scim-rfc6902.js: index.js diff.js equal.js errors.js patch.js pointer.js package.json $(BIN)/browserify
	$(BIN)/browserify $< --transform babelify --plugin derequire/plugin --standalone scim-rfc6902 --outfile $@

%.min.js: %.js
	google-closure-compiler-js --languageIn ECMASCRIPT5 --warningLevel QUIET $< >$@

test: $(TYPESCRIPT:%.ts=%.js) $(BIN)/istanbul $(BIN)/_mocha $(BIN)/coveralls
	$(BIN)/istanbul cover $(BIN)/_mocha -- tests/ --compilers js:babel-core/register -R spec
	cat coverage/lcov.info | $(BIN)/coveralls || true
