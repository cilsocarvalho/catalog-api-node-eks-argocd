IMAGE ?= local/catalog-api
TAG ?= dev

.PHONY: help build run test

help:
	@echo "make build/run/test"

build:
	docker buildx build -t $(IMAGE):$(TAG) --progress=plain .

run:
	docker run --rm -p 8080:8080 \
	  --read-only --tmpfs /tmp --security-opt no-new-privileges \
	  --cap-drop=ALL \
	  --name catalog-api $(IMAGE):$(TAG)

test:
	docker run --rm -v $$PWD:/src -w /src node:20 sh -lc "npm ci && npm test"
