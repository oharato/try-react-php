.PHONY: up test lint
up:
	docker compose up -d
test:
	docker compose exec php php artisan test
lint:
	docker compose exec php ./vendor/bin/pint --test
	docker compose exec php ./vendor/bin/phpstan analyse
	docker compose exec frontend pnpm format
	docker compose exec frontend pnpm lint
	docker compose exec frontend pnpm exec tsc -b --noEmit