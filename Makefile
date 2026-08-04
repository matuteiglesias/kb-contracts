SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.PHONY: help check run docs clean

help:
	@echo "KB Contracts command surface"
	@echo ""
	@echo "Prerequisite: install locked dependencies with npm ci."
	@echo ""
	@echo "  make check  Validate contracts, typecheck, and build documentation"
	@echo "  make run    Start the local Docusaurus documentation server"
	@echo "  make docs   Build the documentation site"
	@echo "  make clean  Clear generated Docusaurus caches and output"

check:
	npm run contract:validate
	npm run typecheck
	npm run build

run:
	npm run start

docs:
	npm run build

clean:
	npm run clear
