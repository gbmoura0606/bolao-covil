# Bolão Covil

Bolão do Covil da Miga — primeira edição para a Copa do Mundo 2026.

## Visão Geral

Aplicativo de bolão de futebol com React Native + Expo (frontend) e Node.js + Express + Prisma (backend).

---

## Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`
- Conta no [Expo](https://expo.dev/) para builds com EAS
- Para o backend: PostgreSQL (local ou via Railway/Supabase)

---

## Desenvolvimento Local (Frontend)

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento

```bash
npx expo start
```

Isso abre o Metro Bundler. Você pode escanear o QR code com o aplicativo Expo Go no seu celular.

### 3. Executar no navegador

```bash
npm run web
```

### 4. Variável de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

---

## Executar no Dispositivo com Expo Go

1. Instale o app **Expo Go** no seu celular (Android ou iOS)
2. Execute `npx expo start`
3. Escaneie o QR code exibido no terminal ou no navegador
4. O app será carregado diretamente no seu celular

> **Nota:** O celular e o computador devem estar na mesma rede Wi-Fi.

---

## Build Android APK (EAS Build)

### 1. Autenticar no EAS

```bash
eas login
```

### 2. Configurar o projeto (primeira vez)

```bash
eas build:configure
```

### 3. Gerar o APK (perfil preview)

```bash
npm run build:android
# ou
eas build --platform android --profile preview
```

O APK será gerado na nuvem e ficará disponível para download no painel do Expo. Compartilhe o link com os participantes do bolão.

---

## iOS PWA via Safari "Adicionar à Tela Inicial"

O app web pode funcionar como PWA no iPhone:

1. Execute `npm run build:web` para gerar os arquivos estáticos
2. Faça deploy no Vercel, Netlify ou Railway (opção static hosting)
3. No iPhone, abra o URL no Safari
4. Toque em **Compartilhar** → **Adicionar à Tela de Início**
5. O app aparecerá como ícone na tela inicial

---

## Backend — Setup Local

### 1. Entrar na pasta do backend

```bash
cd backend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/bolao_covil"
JWT_SECRET="sua-chave-secreta-muito-segura"
PORT=3001
```

### 4. Rodar as migrations do banco

```bash
npx prisma migrate dev --name init
```

### 5. Gerar o Prisma Client

```bash
npx prisma generate
```

### 6. Iniciar o servidor em desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3001`.

### Endpoints disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status do servidor |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Cadastro |
| GET | `/api/auth/me` | Dados do usuário autenticado |
| GET | `/api/matches` | Listar partidas |
| GET | `/api/matches/:id` | Detalhes de uma partida |
| POST | `/api/predictions` | Criar palpite |
| GET | `/api/predictions` | Meus palpites |
| GET | `/api/ranking` | Ranking geral |
| GET | `/api/ranking/league/:id` | Ranking de uma liga |
| GET | `/api/leagues` | Minhas ligas |
| POST | `/api/leagues` | Criar liga |
| POST | `/api/leagues/join` | Entrar em liga por código |

---

## Deploy no Railway

### 1. Criar projeto no Railway

- Acesse [railway.app](https://railway.app) e crie uma conta
- Clique em **New Project** → **Deploy from GitHub repo**
- Selecione o repositório `bolao-covil`

### 2. Adicionar PostgreSQL

- No painel do projeto, clique em **New** → **Database** → **PostgreSQL**
- O Railway criará automaticamente a variável `DATABASE_URL`

### 3. Configurar variáveis de ambiente

No painel do Railway, vá em **Variables** e adicione:

```
JWT_SECRET=sua-chave-secreta-muito-segura
ALLOWED_ORIGINS=https://seu-frontend.railway.app
PORT=3001
```

### 4. Configurar comandos de build e start

Na aba **Settings** do serviço backend:

- **Build Command:** `cd backend && npm install && npx prisma generate && npm run build`
- **Start Command:** `cd backend && npx prisma migrate deploy && npm start`
- **Root Directory:** `/` (raiz do repositório)

### 5. Deploy automático

Cada push para a branch `main` irá disparar um novo deploy automaticamente.

---

## Estrutura do Projeto

```
bolao-covil/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Redirect (login ou tabs)
│   ├── login.tsx           # Tela de login
│   └── (tabs)/
│       ├── _layout.tsx     # Tab bar layout
│       ├── jogos.tsx       # Lista de jogos + palpites
│       ├── ranking.tsx     # Classificação geral
│       ├── ligas.tsx       # Minhas ligas
│       └── configuracoes.tsx # Perfil e configurações
├── components/             # Componentes reutilizáveis
├── services/               # Camada de chamadas à API (mock)
├── hooks/                  # Custom hooks (useAuth, usePredictions)
├── constants/
│   └── theme.ts            # Design system (cores, espaçamentos, tipografia)
├── types/
│   └── index.ts            # Interfaces TypeScript
├── backend/
│   ├── src/index.ts        # Express app
│   ├── routes/             # Rotas da API
│   ├── controllers/        # Lógica de negócio
│   ├── middleware/auth.ts  # Middleware JWT
│   └── prisma/
│       └── schema.prisma   # Schema do banco de dados
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
└── eas.json
```

---

## Credenciais de Demonstração

Para testar o app sem cadastro:

- **E-mail:** `admin@bolao.com`
- **Senha:** `123456`

Qualquer combinação de e-mail válido + senha não vazia também é aceita no modo demo.

---

## Tecnologias

**Frontend:**
- React Native 0.76 + Expo 53
- Expo Router 4 (file-based navigation)
- @react-native-async-storage/async-storage
- @expo/vector-icons (Ionicons)
- Axios

**Backend:**
- Node.js + Express
- Prisma ORM + PostgreSQL
- bcryptjs (hash de senha)
- jsonwebtoken (autenticação JWT)

---

## Licença

Projeto privado — uso interno do Covil da Miga.
