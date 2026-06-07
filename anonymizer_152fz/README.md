# Anonymizer 152-FZ

Система автоматической деперсонализации (пилинга) персональных данных в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».

## Возможности

- Обнаружение 20+ категорий ПДн (regex, NER natasha/spaCy, алгоритм Луна)
- 4 стратегии маскирования: `REDACT`, `PSEUDONYMIZE`, `GENERALIZE`, `TOKENIZE`
- REST API (FastAPI + OpenAPI/Swagger)
- Журнал аудита без хранения исходных ПДн (только SHA-256 хэши)
- Асинхронная пакетная обработка через Celery
- Middleware для чат-ботов (LangChain / OpenAI)
- Rate limiting: 100 запросов/мин на IP
- Режим `dry_run` — показать найденные сущности без маскирования

## Быстрый старт (Docker Compose)

```bash
cd anonymizer_152fz
cp .env.example .env
docker compose up --build
```

API: http://localhost:8000/docs

## Локальный запуск

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Примеры запросов

### Анонимизация текста

```bash
curl -X POST http://localhost:8000/api/v1/anonymize/text \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Позвоните Ивану Петрову по номеру +7 900 123-45-67\", \"strategy\": \"REDACT\", \"return_entities\": true}"
```

### Dry-run (без маскирования)

```bash
curl -X POST http://localhost:8000/api/v1/anonymize/text \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"email: test@mail.ru\", \"dry_run\": true}"
```

### Пакетная обработка

```bash
curl -X POST http://localhost:8000/api/v1/anonymize/batch \
  -H "Content-Type: application/json" \
  -d "{\"texts\": [\"+79001112233\", \"ivan@test.ru\"]}"
```

### Журнал аудита (ст. 18.1 152-ФЗ)

```bash
curl "http://localhost:8000/api/v1/audit/logs?page=1&page_size=20"
```

## Поддерживаемые типы ПДн

| Тип | Категория | Статья 152-ФЗ |
|-----|-----------|---------------|
| NAME | ФИО | ст. 3, 6 |
| BIRTH_DATE | Дата рождения | ст. 3 |
| BIRTH_PLACE | Место рождения | ст. 3 |
| ADDRESS | Адрес | ст. 3 |
| PHONE | Телефон | ст. 3 |
| EMAIL | Email | ст. 3 |
| PASSPORT | Паспорт | ст. 3 |
| SNILS | СНИЛС | ст. 3 |
| INN | ИНН физлица | ст. 3 |
| DRIVER_LICENSE | Водительское удостоверение | ст. 3 |
| OMS_POLICY | Полис ОМС/ДМС | ст. 3 |
| BANK_CARD | Банковская карта (Luhn) | ст. 3 |
| BANK_ACCOUNT | Расчётный счёт | ст. 3 |
| IBAN | IBAN | ст. 3 |
| MEDICAL | Медицинские данные | ст. 10 |
| NATIONALITY | Национальность | ст. 10 |
| POLITICAL | Политические взгляды | ст. 10 |
| RELIGION | Религиозные убеждения | ст. 10 |
| IP_ADDRESS | IPv4/IPv6 | ст. 3 |
| MAC_ADDRESS | MAC-адрес | ст. 3 |
| SESSION_TOKEN | Cookie/session/JWT | ст. 3 |
| PERSONAL_URL | URL с личными параметрами | ст. 3 |

## Правовые основания

| Компонент | Соответствие 152-ФЗ |
|-----------|---------------------|
| Детекторы ПДн | **ст. 3** — определение персональных данных |
| Обработка по согласию/договору | **ст. 6** — правовые основания обработки |
| Спецкатегории (медицина, религия) | **ст. 10** — повышенные требования |
| Журнал аудита | **ст. 18.1** — учёт операций с ПДн |
| Деперсонализация перед LLM | **ст. 6, 19** — минимизация обработки |
| Шифрование псевдонимов AES-256 | **ст. 19** — меры защиты |
| Хранение аудита 3+ года | **ст. 18.1** — сроки учёта (конфигурируемо) |

## Middleware для чат-ботов

```python
from app.config import Settings
from app.core.detector import DetectorOrchestrator
from app.core.masker import MaskerService, MaskingStrategy
from app.middleware.chatbot import ChatBotAnonymizerMiddleware
from app.models.entity_types import EntityType

settings = Settings()
detector = DetectorOrchestrator(settings)
masker = MaskerService(MaskingStrategy.PSEUDONYMIZE, settings.anonymizer_pseudonym_secret_key)
middleware = ChatBotAnonymizerMiddleware(
    detector, masker,
    strategy=MaskingStrategy.PSEUDONYMIZE,
    entity_types=[EntityType.NAME, EntityType.PHONE],
)

chain = middleware.wrap(lambda prompt: llm_call(prompt))
response = chain.invoke("Меня зовут Иван, телефон 89001234567")
```

## Тесты

```bash
pytest
```

Покрытие кода: >80% (`pytest.ini`).

## Конфигурация

См. `.env.example`. Основные переменные:

- `ANONYMIZER_STRATEGY` — стратегия по умолчанию
- `ANONYMIZER_CONFIDENCE_THRESHOLD` — порог уверенности (0.85)
- `ANONYMIZER_PSEUDONYM_SECRET_KEY` — ключ AES-256 для псевдонимов
- `ANONYMIZER_AUDIT_RETENTION_DAYS` — срок хранения аудита (1095 = 3 года)
- `ENABLE_NER` — включить natasha NER

## Архитектура

```
anonymizer_152fz/
├── app/           # FastAPI, детекторы, маскеры, API
├── rules/         # YAML-паттерны regex
├── tests/         # pytest + fixtures
└── docker-compose.yml
```
