# tooltip — техническая документация проекта

> Документ описывает фактическое состояние кодовой базы на 2026-08-30 (ветка `main`, коммит `2a78429`). Все выводы сделаны на основе прочтения исходников, конфигов и истории git, без домыслов о нереализованном функционале.

## 1. Резюме для нового участника команды

`tooltip` — это React 19 + TypeScript + Vite SPA-заготовка, инициализированная официальным шаблоном `create-vite` (react-swc/react) и затем переструктурированная под архитектуру **Feature-Sliced Design (FSD)**. Название репозитория («tooltip») и структура каталогов (`app` / `pages` / `shared`) указывают на намерение — вероятно, библиотека или демо-приложение для компонента тултипа — но на данный момент в коде нет ни одного тултипа, ни бизнес-логики: это чистый, минимально сконфигурированный каркас с одной страницей-заглушкой (`HomePage`, рендерящей текст `Home`).

Если коротко: **это день-0/день-1 проекта**. Ценность документа — зафиксировать архитектурные решения, которые уже приняты (алиасы, слои FSD, strict TS, flat ESLint config), чтобы дальнейшая разработка не расходилась с заложенным каркасом.

## 2. Технологический стек

| Категория | Технология | Версия (package.json) | Комментарий |
|---|---|---|---|
| UI-библиотека | React | ^19.1.1 | новый JSX-рантайм (`jsx: "react-jsx"`), `StrictMode` включён глобально |
| Рендерер | react-dom | ^19.1.1 | `createRoot` API (React 18+ concurrent root) |
| Язык | TypeScript | ~5.9.3 | `strict: true`, без `emit` (сборку берёт на себя Vite/esbuild) |
| Сборщик/дев-сервер | Vite | ^7.1.7 | конфиг — `vite.config.ts` |
| Vite-плагин React | @vitejs/plugin-react | ^5.0.4 | Babel-based Fast Refresh (не SWC-вариант) |
| Линтер | ESLint | ^9.36.0 | flat config (`eslint.config.js`), новый формат без `.eslintrc` |
| TS-интеграция ESLint | typescript-eslint | ^8.45.0 | пресет `recommended`, **не** `recommendedTypeChecked` |
| React-хуки линтинг | eslint-plugin-react-hooks | ^5.2.0 | `recommended-latest` |
| Fast Refresh линтинг | eslint-plugin-react-refresh | ^0.4.22 | пресет `vite` |
| Типы Node | @types/node | ^24.6.0 | нужен для `tsconfig.node.json` (конфиг Vite пишется на TS) |

Пакетный менеджер — npm (наличие `package-lock.json`; `yarn.lock`/`pnpm-lock.yaml` отсутствуют).

Тестового фреймворка, стейт-менеджера (Redux/Zustand/Jotai), роутера, HTTP-клиента, UI-кит библиотеки, CSS-in-JS/Tailwind — **ничего из этого не установлено**. `package.json` содержит только 2 прод-зависимости и 10 dev-зависимостей, перечисленных выше.

## 3. Скрипты npm

```jsonc
"scripts": {
  "dev": "vite",            // дев-сервер с HMR
  "build": "tsc -b && vite build", // сначала project-references сборка типов, затем прод-бандл
  "lint": "eslint .",       // линт всего репозитория по flat config
  "preview": "vite preview" // локальный сервер поверх собранного dist/
}
```

Важный нюанс: `build` сначала гоняет `tsc -b` (несёт ответственность **только** за проверку типов — оба `tsconfig.*.json` имеют `"noEmit": true`), и лишь потом Vite делает фактическую транспиляцию/бандлинг через esbuild/Rollup. Если `tsc -b` падает — Vite-сборка не запустится (fail-fast на уровне типов).

## 4. Архитектура: Feature-Sliced Design (FSD)

Каталог `src/` организован по слоям FSD, хотя пока задействованы только два верхних слоя:

```
src/
├── app/            # слой "app" — инициализация, провайдеры, глобальные стили, точка сборки
│   ├── index.ts
│   ├── providers/
│   │   └── index.tsx
│   ├── styles/
│   │   └── index.css
│   └── ui/
│       └── app.tsx
├── pages/          # слой "pages" — композиция фич/виджетов в конкретный экран
│   └── home/
│       ├── index.ts
│       └── ui/
│           └── home-page.tsx
├── shared/         # слой "shared" — переиспользуемые ресурсы без бизнес-логики
│   └── assets/
│       └── react.svg
└── main.tsx        # bootstrap-файл, точка входа Vite (см. index.html)
```

Слои `widgets`, `features`, `entities`, `processes` из классической FSD **пока не созданы** — это ожидаемо для проекта такого размера (одна страница), но при добавлении второй страницы или переиспользуемого блока UI стоит явно решить, в какой слой он ложится, чтобы не размывать границы с самого начала.

### 4.1. Паттерн публичного API слоя (barrel-файлы)

Каждый слой/срез экспортирует наружу только то, что описано в его `index.ts`/`index.tsx` — это соблюдение принципа **public API** FSD: соседние слои не должны залезать во внутренние `ui/`-папки напрямую.

- `src/app/index.ts` — публикует `AppRoot` (собранный компонент) и тип `AppProps`.
- `src/pages/home/index.ts` — публикует только `HomePage`.

Импорты в проекте идут исключительно через алиас `@/...` (см. §5), что дополнительно защищает от относительных `../../../` путей.

### 4.2. Поток инициализации приложения (bootstrap)

```
index.html
  └─ <script type="module" src="/src/main.tsx">
       └─ main.tsx
            ├─ import '@/app/styles/index.css'   // глобальные CSS-переменные, тема
            └─ createRoot(#root).render(<AppRoot />)
                 └─ AppRoot = withProviders(App)      [src/app/index.ts]
                      └─ withProviders(Component)     [src/app/providers/index.tsx]
                           └─ оборачивает Component в <StrictMode>
                                └─ App                [src/app/ui/app.tsx]
                                     └─ рендерит <HomePage />  [src/pages/home]
                                          └─ <main className="home-page">Home</main>
```

Ключевые наблюдения по каждому звену:

- **`main.tsx`** — использует non-null assertion `document.getElementById('root')!`. Стандартно для шаблона Vite, но в проде при отсутствии `#root` в DOM даст неинформативную ошибку рантайма («Cannot read properties of null»); в шаблоне `index.html` `#root` присутствует, поэтому риска на практике нет, но это стоит держать в уме, если `index.html` начнут менять.
- **`withProviders`** (`src/app/providers/index.tsx`) — HOC-фабрика с дженериком `<Props extends object>`, сейчас оборачивает только в `StrictMode`. Само название и паттерн (`withProviders`) явно спроектированы как **точка расширения**: сюда логично добавлять `ErrorBoundary`, `ThemeProvider`, `QueryClientProvider`, `RouterProvider` и т.п. по мере роста проекта — не заводя отдельные обёртки в `main.tsx`.
- **`App`** (`src/app/ui/app.tsx`) — сейчас без роутинга, безусловно рендерит `HomePage`. `AppProps` типизирован как `Record<never, never>` (то есть «объект без полей») — явный сигнал, что компонент осознанно бespropsовый, а не забыли типизацию.
- **`HomePage`** (`src/pages/home/ui/home-page.tsx`) — функция без экспорта по умолчанию (`export function HomePage`), возвращает `<main className="home-page">Home</main>`. Класс `.home-page` нигде не описан в CSS — то есть стилизация страницы ещё не начата.

## 5. Конфигурация путей и сборки

### 5.1. Алиас `@/*`

Алиас настроен **дважды и согласованно** — критично для непротиворечивой работы IDE и сборщика:

- В Vite (`vite.config.ts`): `resolve.alias['@']` → `fileURLToPath(new URL('./src', import.meta.url))`.
- В TypeScript (`tsconfig.app.json` и `tsconfig.node.json`): `paths: { "@/*": ["./src/*"] }` c `baseUrl: "."`.

Использование в коде: `import { AppRoot } from '@/app'`, `import { HomePage } from '@/pages/home'`. Абсолютные алиасы вместо относительных импортов — хорошая практика для FSD, так как не даёт импортам «пролезать» вглубь чужого слоя случайно через `../../..`.

### 5.2. Двухконтурная TypeScript-конфигурация (project references)

`tsconfig.json` — пустой корневой файл-агрегатор (`"files": []`), который через `references` подключает:

- **`tsconfig.app.json`** — конфиг для кода приложения (`include: ["src"]`), таргет `ES2022`, либы `ES2022/DOM/DOM.Iterable`, `jsx: "react-jsx"`, `types: ["vite/client"]` (даёт типы для `import.meta.env`, `*.svg`-импортов и т.д.).
- **`tsconfig.node.json`** — конфиг для файлов, исполняемых в Node-контексте сборки (`include: ["vite.config.ts"]`), таргет `ES2023`, `types: ["node"]`.

Это стандартный подход современного Vite-шаблона: конфиг Vite и код приложения линтуются/тайпчекаются в разных «мирах» (DOM vs Node), но оба поддерживают один и тот же алиас `@/*` и одинаково строгие флаги.

**Общие строгие флаги в обоих конфигах** (стоит поддерживать при добавлении новых tsconfig-файлов):
```jsonc
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"erasableSyntaxOnly": true,        // запрещает TS-синтаксис, не стираемый транспилятором (enum, namespace и т.п. без --isolatedModules совместимости)
"noFallthroughCasesInSwitch": true,
"noUncheckedSideEffectImports": true,
"verbatimModuleSyntax": true,      // требует явных `import type` для типовых импортов
"moduleResolution": "bundler"
```
Это заметно более строгий набор, чем дефолт `create-vite`, — проект явно настроен на дисциплину типов с первого дня.

### 5.3. ESLint (flat config, `eslint.config.js`)

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
  },
])
```

Замечания для senior review:
- Используется `tseslint.configs.recommended`, а не `recommendedTypeChecked`/`strictTypeChecked` — то есть правила ESLint **не имеют доступа к типовой информации** (нет проверок вроде `no-floating-promises`, `no-unsafe-*`). README сам явно документирует, как включить type-aware линтинг, но проект этого пока не сделал.
- `reactRefresh.configs.vite` — следит, чтобы файлы, экспортирующие компоненты, не экспортировали заодно произвольные не-компонентные сущности (важно для корректной работы HMR). Это уже сейчас имеет значение для barrel-файлов вроде `src/app/index.ts`, который экспортирует и `AppRoot` (компонент), и тип `AppProps` — тип-экспорты не ломают это правило, поэтому конфликта нет.
- Нет отдельного конфига/оверрайда для `*.config.ts`/`*.node.ts` файлов (например, чтобы разрешить `console.log` в конфиге, если понадобится) — сейчас не критично, единственный такой файл `vite.config.ts` укладывается в общие правила.

## 6. Стилизация

Единственный источник стилей — `src/app/styles/index.css`, подключаемый side-effect импортом в `main.tsx`. Это **нетронутые стили из шаблона Vite create-react**:

- `:root` задаёт системный font-stack, `color-scheme: light dark`, тёмную палитру по умолчанию (`background: #242424`, `color: rgba(255,255,255,.87)`).
- `@media (prefers-color-scheme: light)` переопределяет палитру на светлую.
- Стилизованы дефолтные HTML-теги: `a`, `body`, `#root`, `h1`, `button` — типичные заготовки под демо-страницу "Vite + React" (`#root { max-width: 1280px; text-align: center; }` и т.д.).

**Существенное наблюдение:** класс `.home-page`, который использует `HomePage`, не описан нигде в CSS — то есть страница сейчас наследует только глобальные стили тегов, специфичной стилизации у неё нет. Если проект действительно про тултипы, здесь ожидаемо появится либо CSS-модуль/design-tokens слой в `shared`, либо CSS-in-JS решение — на сегодня выбор технологии стилизации ещё не сделан.

## 7. Статические ассеты

- `public/vite.svg` — фавикон, подключён в `index.html` (`<link rel="icon" ...>`), раздаётся Vite как есть из `public/` (без обработки бандлером).
- `src/shared/assets/react.svg` — лого React из шаблона, лежит в `shared`-слое FSD (корректное место для переиспользуемых статических ресурсов), но **нигде в коде не импортируется** — мёртвый актив, оставшийся от шаблона `create-vite`.

## 8. HTML entry point

`index.html`:
```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```
`<title>tooltip</title>` уже переименован под проект (в отличие от стилей/ассетов). `lang="en"` — англоязычная разметка, стоит учитывать при добавлении локализации.

## 9. Состояние репозитория и история

Ветка `main`, рабочее дерево чистое на момент написания документа. История коммитов показывает два разных сценария активности:

1. **Базовая инициализация**: `91d4087 first commit` → `d260211 end tooltip` — стандартный скелет `create-vite`, зафиксированный как отправная точка.
2. **Серия из ~15 коммитов `docs: create/update/remove ...`** над каталогом `docs/` в корне репозитория (`docs/index.md`, `docs/test.md`, `docs/a.md`, `docs/t/t.md`, `docs/afaf.md`, папки `t/` и `test/` и т.д.), все они последовательно созданы и затем удалены в тот же день (2026-08-30). Судя по паттерну имён (`a.md`, `afaf.md`, `1.md`) и полной симметрии create→remove, это выглядит как **тестовый прогон автоматизации** (например, отладка bot/automation-сценария создания и очистки файлов), а не осмысленная документация продукта. От этой активности в репозитории остался только `docs/test/.gitkeep` (пустая директория, отслеживаемая git).

Это отдельный, ортогональный `denjs/docs/` каталог (в котором находится этот файл) — в корне репозитория есть собственный `docs/`, не относящийся к слою `denjs`.

## 10. Оценка зрелости проекта (senior-level review)

Честная оценка «что здесь есть, а чего нет», чтобы не создавать иллюзию готовности:

**Есть и сделано аккуратно:**
- Чёткое разделение по слоям FSD с public-API barrel-файлами.
- Единообразный, строгий TypeScript (project references, `strict`, `verbatimModuleSyntax`).
- Согласованные алиасы путей между Vite и TS.
- Точка расширения под провайдеры (`withProviders`) заложена заранее, а не добавлена постфактум.
- Современный flat ESLint config под ESLint 9 / typescript-eslint 8.

**Отсутствует полностью (ожидаемо для текущей стадии, но стоит держать в бэклоге):**
- Тесты любого уровня (unit/component/e2e) — не установлен ни один test runner (Vitest, Jest, Playwright, RTL).
- CI/CD — нет `.github/workflows` или аналогов; `lint`/`build` не проверяются автоматически при пуше.
- Роутинг — `App` рендерит `HomePage` напрямую, без `react-router` или альтернатив; при появлении второй страницы это первое, что понадобится.
- State management — ничего не подключено; пока не нужно при одном статическом экране.
- Реальный UI/бизнес-логика — `HomePage` это buffer-заглушка (`Home`), тултип-функциональность, вынесенная в название репозитория, ещё не начата.
- Type-aware ESLint правила, несмотря на то что сам README проекта объясняет, как их включить.
- CSS-стратегия — используются стили шаблона `create-vite` «как есть», страничные классы (`.home-page`) не реализованы.

## 11. Рекомендации по дальнейшему развитию

1. Прежде чем добавлять вторую страницу — определиться с роутером (`react-router` v7 — наиболее естественный выбор под React 19/Vite) и завести слой `app/providers` под `RouterProvider`, используя уже готовый `withProviders`.
2. Завести `entities`/`features`/`widgets` по мере появления первого реального переиспользуемого блока — не создавать эти папки впрок пустыми.
3. Определить стратегию стилизации до того, как накопится css в стиле шаблона (CSS Modules, если оставаться на чистом CSS с изоляцией классов — самый низкий порог входа при текущем стеке).
4. Подключить Vitest + React Testing Library — согласуется с Vite-стеком без доп. конфигурации транспиляции.
5. Удалить неиспользуемый `src/shared/assets/react.svg`, если лого React в проекте не планируется показывать.
6. Добавить `noEmitOnError`/CI-шаг, который гоняет `npm run lint && npm run build` на PR, — сейчас ничего не мешает закоммитить код с ошибками типов или линта.
7. Обновить `README.md` в корне репозитория — сейчас это дословный README шаблона `create-vite`, не описывающий сам проект `tooltip`; данный файл (`denjs/docs/README.md`) может стать источником правды для секции «Architecture» в корневом README.

## 12. Быстрый старт (для справки)

```bash
npm install
npm run dev       # http://localhost:5173 по умолчанию
npm run lint
npm run build      # tsc -b && vite build → ./dist
npm run preview    # раздать собранный ./dist локально
```

Node.js версия явно не зафиксирована (`.nvmrc`/`engines` в `package.json` отсутствуют) — стоит зафиксировать под LTS, совместимую с Vite 7 (Node ≥ 18.18, рекомендуется 20+).
