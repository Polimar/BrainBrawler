# BrainBrawler - Documentazione Completa del Progetto

## Indice
1. [Overview del Progetto](#overview-del-progetto)
2. [Meccaniche di Gioco](#meccaniche-di-gioco)
3. [Architettura del Sistema](#architettura-del-sistema)
4. [Backend](#backend)
5. [Frontend Web](#frontend-web)
6. [App Mobile](#app-mobile)
7. [Infrastruttura e DevOps](#infrastruttura-e-devops)
8. [Problemi Riscontrati e Soluzioni](#problemi-riscontrati-e-soluzioni)
9. [Setup Ambiente di Sviluppo](#setup-ambiente-di-sviluppo)
10. [Memorie e Best Practices](#memorie-e-best-practices)
11. [To-Do List per Nuovo Sviluppo](#to-do-list-per-nuovo-sviluppo)

## Overview del Progetto

**BrainBrawler** è un gioco multiplayer di quiz in tempo reale che combina elementi di trivia con meccaniche di battaglia. I giocatori competono rispondendo a domande di varia difficoltà in sessioni P2P, con supporto per fino a 10 giocatori simultanei.

![BrainBrawler Logo](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iMjAiIGZpbGw9IiNGRkQwMDAiLz4KPGR0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0ZGNjk0MyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QnJhaW48L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0ZGNjk0MyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QnJhd2xlcjwvdGV4dD4KPGV4cHRoIGQ9Im01MCAyNWMtMTAgMC0xOCA4LTE4IDE4djE4YzAgMTAgOCAxOCAxOCAxOHMxOC04IDE4LTE4di0xOGMwLTEwLTgtMTgtMTgtMTh6IiBmaWxsPSIjRkY2OTkzIi8+Cjwvc3ZnPgo=)

### Caratteristiche Principali
- **Multiplayer Real-time**: Fino a 10 giocatori per sessione
- **Sistema P2P**: Comunicazione diretta tra client tramite WebRTC
- **Categorie Multiple**: Domande organizzate per argomento e difficoltà
- **Sistema di Punteggio**: Basato su velocità e correttezza delle risposte
- **Autenticazione**: Sistema completo con JWT e refresh tokens
- **Cross-platform**: Web e mobile (Android/iOS)
- **Sistema Freemium**: Account gratuiti con pubblicità e premium senza limitazioni
- **Gestione Amicizie**: Sistema completo di ricerca, richieste e accettazione amicizie
- **Creazione Contenuti Premium**: Inserimento manuale, massivo o via API LLM per utenti premium
- **Design Moderno e Accattivante**: UI/UX responsive con colori vivaci e animazioni divertenti
- **Sistema Avatar**: Personalizzazione del profilo con avatar disponibili per tutti gli utenti
- **In-App Purchases**: Possibilità di acquisti per contenuti premium e personalizzazioni

### Design e User Experience

#### Filosofia di Design
- **Colori Vivaci**: Palette cromatica energetica con tonalità accese (arancione, rosa, giallo, viola)
- **Animazioni Divertenti**: Micro-interazioni fluide e coinvolgenti
- **Design Responsive**: Adattamento perfetto a tutti i dispositivi e orientamenti
- **Iconografia Moderna**: Icone flat e intuitive con design coerente
- **Typography**: Font moderni e leggibili con gerarchia visiva chiara

#### Elementi Grafici Distintivi
- **Logo BrainBrawler**: Icona con cervello rosa su sfondo giallo, design 3D accattivante
- **Tema Gaming**: Elementi UI ispirati ai videogames moderni
- **Feedback Visivo**: Animazioni di successo/errore, particelle e effetti wow
- **Transizioni Fluide**: Animazioni smooth tra schermate e stati
- **Dark/Light Mode**: Supporto per entrambi i temi con transizioni animate

#### Componenti UI Avanzati
- **Loading Animations**: Spinner personalizzati a tema cervello
- **Progress Bars**: Barre di progresso animate con effetti gradiente
- **Cards Interattive**: Elementi con hover states e animazioni 3D
- **Floating Action Buttons**: Bottoni fluttuanti con icone animate
- **Toast Notifications**: Notifiche eleganti con auto-dismiss

### Sistema Avatar e Personalizzazione

#### Avatar per Tutti gli Utenti
- **Avatar Gratuiti**: 20+ avatar base disponibili per account FREE
- **Personalizzazione Base**: Colori e accessori limitati per utenti gratuiti
- **Avatar Premium**: 100+ avatar esclusivi per utenti premium
- **Customizzazione Avanzata**: Editor completo per utenti premium

#### Categorie Avatar
- **Animali**: Gatto, cane, leone, panda, volpe, gufo, etc.
- **Fantasy**: Mago, cavaliere, elfo, drago, unicorno, etc.
- **Professionisti**: Dottore, scienziato, chef, artista, musicista, etc.
- **Sci-Fi**: Robot, astronauta, alieno, cyborg, etc.
- **Stagionali**: Avatar tematici per festività e eventi speciali

#### Personalizzazione Avatar
```typescript
interface Avatar {
  id: string;
  name: string;
  category: AvatarCategory;
  isPremium: boolean;
  basePrice?: number; // Per acquisti in-app
  customization: {
    colors: string[];
    accessories: Accessory[];
    animations: Animation[];
  };
}

interface AvatarCustomization {
  selectedColor: string;
  accessories: string[];
  preferredAnimation: string;
}
```

### Sistema In-App Purchases

#### Categorie di Acquisti
1. **Avatar Premium**
   - Avatar esclusivi: €0.99 - €2.99
   - Pack avatar tematici: €4.99 - €9.99
   - Avatar animati speciali: €1.99 - €4.99

2. **Personalizzazioni**
   - Color packs: €0.99
   - Accessory packs: €1.99
   - Animation packs: €2.99

3. **Question Sets Premium**
   - Set domande specializzate: €1.99 - €4.99
   - Bundle categorie: €9.99 - €19.99

4. **Power-ups e Bonus**
   - Double XP boosts: €0.99
   - Extra lives: €0.99
   - Hint tokens: €1.99

5. **Subscription Premium**
   - Premium mensile: €4.99/mese
   - Premium annuale: €39.99/anno (33% sconto)

#### Implementazione Acquisti
- **Google Play Billing**: Per Android
- **App Store Connect**: Per iOS (futuro)
- **Stripe**: Per web payments
- **Validazione Server-side**: Sicurezza anti-fraud
- **Restore Purchases**: Ripristino acquisti su nuovi dispositivi

## Meccaniche di Gioco

### Sistema Account Types

#### Account FREE
- **Limitazioni**:
  - Possono solo unirsi a partite create da altri
  - Non possono creare nuove room di gioco
  - Visualizzano pubblicità Google Native 
  - Accesso solo ai question set creati dai loro amici premium
  - Possono richiedere e accettare amicizie
  - Possono giocare con amici

#### Account PREMIUM
- **Privilegi**:
  - Creazione partite personalizzate con:
    - Numero giocatori configurabile (2-10)
    - Numero domande personalizzabile (10-50)
    - Tempo di risposta configurabile (10-60 secondi)
  - Creazione question set personalizzati:
    - Inserimento manuale domande
    - Caricamento massivo via JSON
    - Generazione automatica via API LLM (OpenAI, Claude, Gemini, etc.)
  - Nessuna pubblicità
  - Accesso a tutti i question set premium
  - Gestione avanzata amicizie con gruppi

### Sistema Pubblicità (Account FREE)
- **Google Mobile Ads** integrato nell'app mobile
- **Interstitial Ads** mostrati:
   - All'ingresso in una nuova partita
   - sotto le domande
  - Dopo completamento partita
- **Banner Ads** visualizzati:
  - In fondo alla schermata di lobby
  - Durante l'attesa tra round

### Gestione Amicizie

#### Funzionalità Base
- **Ricerca Utenti**: Per username o email
- **Richieste Amicizia**: Invio e ricezione richieste
- **Gestione Richieste**: Accettazione o rifiuto
- **Lista Amici**: Visualizzazione amici con stato online/offline
- **Inviti Privati**: Possibilità di invitare amici direttamente in partita

#### Interfaccia Amicizie
- **Pagina Ricerca**: Campo di ricerca con suggerimenti
- **Pagina Richieste**: Lista richieste ricevute e inviate
- **Pagina Amici**: Lista amici con opzioni di gioco
- **Notifiche Real-time**: Notifiche push per nuove richieste

### Flusso di Gioco
1. **Lobby**: I giocatori creano o si uniscono a una stanza
2. **Selezione Categoria**: Il leader(utente Premium) della stanza sceglie il set di domande tra quelle che ha inserito
3. **Round di Domande**: 
   - Ogni giocatore riceve la stessa domanda simultaneamente
   - Timer in evidenza per rispondere
   - Punti assegnati in base a correttezza e velocità
4. **Classifica Live**: Aggiornamento in tempo reale dei punteggi
5. **Vincitore**: Chi accumula più punti dopo N round

### Sistema di Punteggio
- Risposta corretta: 100 punti base
- Bonus velocità: (30 - secondi_impiegati) * 3
- Penalità risposta errata: -50 punti
- Nessuna risposta: 0 punti

## Architettura del Sistema

### Stack Tecnologico
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL con Prisma ORM
- **Cache/PubSub**: Redis
- **Frontend Web**: React + TypeScript + Material-UI
- **Mobile**: React Native + TypeScript
- **Real-time**: WebSocket (Socket.io) + WebRTC
- **Reverse Proxy**: Traefik
- **Containerizzazione**: Docker + Docker Compose
- **Orchestrazione**: Portainer

### Comunicazione
```
┌─────────────┐     HTTPS/WSS      ┌─────────────┐
│   Mobile    │ ◄─────────────────► │             │
│     App     │                     │   Traefik   │
└─────────────┘                     │   (Proxy)   │
                                    │             │
┌─────────────┐     HTTPS/WSS      │  Port 80/443│
│     Web     │ ◄─────────────────► │             │
│   Frontend  │                     └──────┬──────┘
└─────────────┘                            │
                                           │
                    ┌──────────────────────┴───────────────────┐
                    │                                          │
                    ▼                                          ▼
            ┌───────────────┐                        ┌─────────────────┐
            │    Backend    │                        │    Frontend     │
            │   Node.js     │                        │  React Server   │
            │   Port 3000   │                        │   Port 3001     │
            └───────┬───────┘                        └─────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
┌───────────────┐      ┌─────────────────┐
│  PostgreSQL   │      │      Redis      │
│   Database    │      │  Cache/PubSub   │
└───────────────┘      └─────────────────┘
```

## Backend

### Struttura Directory
```
backend/
├── src/
│   ├── config/          # Configurazioni (database, redis, etc.)
│   ├── controllers/     # Controller per le route
│   ├── middleware/      # Middleware (auth, error handling)
│   ├── models/          # Modelli Prisma
│   ├── routes/          # Definizione delle API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types/interfaces
│   ├── utils/           # Utility functions
│   ├── websocket/       # WebSocket handlers
│   └── server.ts        # Entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── tests/               # Test files
├── package.json
└── tsconfig.json
```

### API Endpoints

#### Autenticazione
- `POST /api/auth/register` - Registrazione nuovo utente
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Profilo utente corrente
- `POST /api/auth/verify-email` - Verifica email

#### Question Sets
- `GET /api/question-sets` - Lista set di domande
- `GET /api/question-sets/:id` - Dettaglio set
- `POST /api/question-sets` - Crea nuovo set (admin)
- `PUT /api/question-sets/:id` - Modifica set (admin)
- `DELETE /api/question-sets/:id` - Elimina set (admin)

#### Games
- `POST /api/games` - Crea nuova partita
- `GET /api/games/:id` - Dettaglio partita
- `POST /api/games/:id/join` - Unisciti a partita
- `POST /api/games/:id/start` - Avvia partita (leader)
- `POST /api/games/:id/answer` - Invia risposta

#### Amicizie
- `GET /api/friends` - Lista amici dell'utente corrente
- `GET /api/friends/requests` - Richieste di amicizia ricevute
- `GET /api/friends/sent-requests` - Richieste di amicizia inviate
- `POST /api/friends/search` - Ricerca utenti per username/email
- `POST /api/friends/request` - Invia richiesta di amicizia
- `POST /api/friends/accept/:requestId` - Accetta richiesta di amicizia
- `POST /api/friends/reject/:requestId` - Rifiuta richiesta di amicizia
- `DELETE /api/friends/:friendId` - Rimuovi amicizia
- `GET /api/friends/:friendId/status` - Stato online dell'amico

#### Premium Features
- `POST /api/premium/question-sets` - Crea question set personalizzato (premium)
- `POST /api/premium/question-sets/bulk` - Caricamento massivo domande (premium)
- `POST /api/premium/question-sets/generate` - Genera domande via LLM (premium)
- `PUT /api/premium/question-sets/:id` - Modifica question set proprio (premium)
- `DELETE /api/premium/question-sets/:id` - Elimina question set proprio (premium)
- `POST /api/premium/games/custom` - Crea partita personalizzata (premium)
- `GET /api/premium/llm-providers` - Lista provider LLM supportati (premium)
- `POST /api/premium/llm-config` - Configura API LLM personale (premium)

#### Subscription & Ads
- `POST /api/subscription/upgrade` - Upgrade a premium
- `GET /api/subscription/status` - Stato subscription corrente
- `POST /api/ads/impression` - Traccia visualizzazione ads (free users)
- `POST /api/ads/click` - Traccia click ads (free users)

#### Sistema Avatar
- `GET /api/avatars` - Lista avatar disponibili (free + premium)
- `GET /api/avatars/categories` - Categorie avatar
- `GET /api/avatars/user` - Avatar corrente dell'utente
- `POST /api/avatars/select` - Seleziona avatar
- `GET /api/avatars/:id/customization` - Opzioni personalizzazione avatar
- `POST /api/avatars/:id/customize` - Personalizza avatar
- `GET /api/avatars/owned` - Avatar posseduti dall'utente

#### In-App Purchases
- `GET /api/shop/items` - Catalogo shop (avatar, packs, power-ups)
- `GET /api/shop/categories` - Categorie shop
- `POST /api/shop/purchase` - Inizia processo acquisto
- `POST /api/shop/verify` - Verifica acquisto completato
- `GET /api/shop/purchases` - Storico acquisti utente
- `POST /api/shop/restore` - Ripristina acquisti su nuovo dispositivo
- `GET /api/shop/cart` - Carrello utente
- `POST /api/shop/cart/add` - Aggiungi al carrello
- `DELETE /api/shop/cart/:itemId` - Rimuovi dal carrello

### Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  username      String    @unique
  accountType   AccountType @default(FREE)
  premiumExpiresAt DateTime?
  isOnline      Boolean   @default(false)
  lastSeen      DateTime  @default(now())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  games         GamePlayer[]
  refreshTokens RefreshToken[]
  ownedQuestionSets QuestionSet[] @relation("QuestionSetOwner")
  
  // Avatar system
  selectedAvatarId String?
  selectedAvatar   Avatar? @relation("SelectedAvatar", fields: [selectedAvatarId], references: [id])
  ownedAvatars     UserAvatar[]
  avatarCustomizations AvatarCustomization[]
  
  // Friendship relations
  sentFriendRequests     FriendRequest[] @relation("SentRequests")
  receivedFriendRequests FriendRequest[] @relation("ReceivedRequests")
  friendships1           Friendship[]    @relation("User1Friendships")
  friendships2           Friendship[]    @relation("User2Friendships")
  
  // LLM Configuration
  llmConfigs    LLMConfig[]
  
  // Ads tracking
  adImpressions AdImpression[]
  
  // In-app purchases
  purchases     Purchase[]
  cart          CartItem[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model QuestionSet {
  id          String     @id @default(cuid())
  name        String
  description String?
  category    String
  difficulty  Difficulty
  isPublic    Boolean    @default(true)
  isPremium   Boolean    @default(false)
  ownerId     String?    // null for system question sets
  questions   Question[]
  games       Game[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  owner User? @relation("QuestionSetOwner", fields: [ownerId], references: [id])
}

model Question {
  id            String      @id @default(cuid())
  questionSetId String
  questionSet   QuestionSet @relation(fields: [questionSetId], references: [id])
  text          String
  options       Json        // Array of {id, text}
  correctAnswer String
  timeLimit     Int         @default(30)
  points        Int         @default(100)
  order         Int
}

model Game {
  id             String       @id @default(cuid())
  code           String       @unique
  questionSetId  String
  questionSet    QuestionSet  @relation(fields: [questionSetId], references: [id])
  status         GameStatus   @default(WAITING)
  maxPlayers     Int          @default(8)
  currentRound   Int          @default(0)
  totalRounds    Int          @default(10)
  timePerQuestion Int         @default(30)
  isPrivate      Boolean      @default(false)
  inviteCode     String?      @unique
  players        GamePlayer[]
  createdAt      DateTime     @default(now())
  startedAt      DateTime?
  endedAt        DateTime?
}

model GamePlayer {
  id        String   @id @default(cuid())
  gameId    String
  game      Game     @relation(fields: [gameId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  score     Int      @default(0)
  isLeader  Boolean  @default(false)
  joinedAt  DateTime @default(now())
  
  @@unique([gameId, userId])
}

model FriendRequest {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  status     FriendRequestStatus @default(PENDING)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  sender     User @relation("SentRequests", fields: [senderId], references: [id])
  receiver   User @relation("ReceivedRequests", fields: [receiverId], references: [id])
  
  @@unique([senderId, receiverId])
}

model Friendship {
  id        String   @id @default(cuid())
  user1Id   String
  user2Id   String
  createdAt DateTime @default(now())
  
  user1 User @relation("User1Friendships", fields: [user1Id], references: [id])
  user2 User @relation("User2Friendships", fields: [user2Id], references: [id])
  
  @@unique([user1Id, user2Id])
}

model LLMConfig {
  id       String @id @default(cuid())
  userId   String
  provider LLMProvider
  apiKey   String // Encrypted
  endpoint String?
  model    String?
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, provider])
}

model AdImpression {
  id        String   @id @default(cuid())
  userId    String
  adType    AdType
  adUnit    String
  clicked   Boolean  @default(false)
  revenue   Decimal? @db.Decimal(10,4)
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}

model Avatar {
  id          String @id @default(cuid())
  name        String
  description String?
  category    AvatarCategory
  imageUrl    String
  animationUrl String?
  isPremium   Boolean @default(false)
  price       Decimal? @db.Decimal(10,2)
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)
  createdAt   DateTime @default(now())
  
  // Relations
  selectedByUsers User[] @relation("SelectedAvatar")
  ownedByUsers    UserAvatar[]
  customizations  AvatarCustomization[]
  shopItems       ShopItem[]
}

model UserAvatar {
  id        String   @id @default(cuid())
  userId    String
  avatarId  String
  unlockedAt DateTime @default(now())
  purchaseId String?
  
  user     User     @relation(fields: [userId], references: [id])
  avatar   Avatar   @relation(fields: [avatarId], references: [id])
  purchase Purchase? @relation(fields: [purchaseId], references: [id])
  
  @@unique([userId, avatarId])
}

model AvatarCustomization {
  id        String @id @default(cuid())
  userId    String
  avatarId  String
  colorScheme Json // {primary: "#FF6943", secondary: "#FFD700"}
  accessories Json // ["hat", "glasses", "bowtie"]
  animation   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user   User   @relation(fields: [userId], references: [id])
  avatar Avatar @relation(fields: [avatarId], references: [id])
  
  @@unique([userId, avatarId])
}

model ShopItem {
  id          String @id @default(cuid())
  name        String
  description String
  category    ShopCategory
  itemType    ShopItemType
  price       Decimal @db.Decimal(10,2)
  originalPrice Decimal? @db.Decimal(10,2)
  currency    String @default("EUR")
  
  // Product data
  avatarId    String?
  avatar      Avatar? @relation(fields: [avatarId], references: [id])
  bundleItems Json? // For bundle products
  metadata    Json? // Additional product data
  
  // Availability
  isActive    Boolean @default(true)
  isFeatured  Boolean @default(false)
  availableFrom DateTime?
  availableUntil DateTime?
  maxPurchases Int? // Limit per user
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  purchases   Purchase[]
  cartItems   CartItem[]
}

model Purchase {
  id            String @id @default(cuid())
  userId        String
  shopItemId    String
  transactionId String @unique // From payment provider
  platform      PurchasePlatform
  status        PurchaseStatus @default(PENDING)
  amount        Decimal @db.Decimal(10,2)
  currency      String
  paymentMethod String?
  
  // Validation
  receipt       Json? // Store receipt data
  verified      Boolean @default(false)
  verifiedAt    DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User @relation(fields: [userId], references: [id])
  shopItem      ShopItem @relation(fields: [shopItemId], references: [id])
  userAvatars   UserAvatar[]
}

model CartItem {
  id         String @id @default(cuid())
  userId     String
  shopItemId String
  quantity   Int @default(1)
  addedAt    DateTime @default(now())
  
  user     User     @relation(fields: [userId], references: [id])
  shopItem ShopItem @relation(fields: [shopItemId], references: [id])
  
  @@unique([userId, shopItemId])
}

enum AccountType {
  FREE
  PREMIUM
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum GameStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum FriendRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum LLMProvider {
  OPENAI
  ANTHROPIC
  GOOGLE
  CUSTOM
}

enum AdType {
  BANNER
  INTERSTITIAL
  REWARDED
}

enum AvatarCategory {
  ANIMALS
  FANTASY
  PROFESSIONALS
  SCIFI
  SEASONAL
  EXCLUSIVE
}

enum ShopCategory {
  AVATARS
  CUSTOMIZATION
  QUESTION_SETS
  POWER_UPS
  SUBSCRIPTIONS
  BUNDLES
}

enum ShopItemType {
  AVATAR
  COLOR_PACK
  ACCESSORY_PACK
  ANIMATION_PACK
  QUESTION_SET
  POWER_UP
  SUBSCRIPTION
  BUNDLE
}

enum PurchasePlatform {
  GOOGLE_PLAY
  APP_STORE
  WEB_STRIPE
}

enum PurchaseStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}
```

### Dipendenze Backend
```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "express": "^4.x",
    "socket.io": "^4.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "redis": "^4.x",
    "cors": "^2.x",
    "helmet": "^7.x",
    "express-rate-limit": "^6.x",
    "dotenv": "^16.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/express": "^4.x",
    "typescript": "^5.x",
    "ts-node-dev": "^2.x",
    "prisma": "^5.x",
    "jest": "^29.x",
    "@types/jest": "^29.x"
  }
}
```

### Schema JSON per Caricamento Massivo Domande

#### Formato JSON per Bulk Upload
```json
{
  "questionSet": {
    "name": "Geografia Italia",
    "description": "Domande sulla geografia italiana",
    "category": "Geografia",
    "difficulty": "MEDIUM",
    "isPublic": false,
    "isPremium": true
  },
  "questions": [
    {
      "text": "Qual è la capitale dell'Italia?",
      "options": [
        {"id": "a", "text": "Milano"},
        {"id": "b", "text": "Roma"},
        {"id": "c", "text": "Napoli"},
        {"id": "d", "text": "Torino"}
      ],
      "correctAnswer": "b",
      "timeLimit": 30,
      "points": 100,
      "order": 1
    },
    {
      "text": "Qual è il fiume più lungo d'Italia?",
      "options": [
        {"id": "a", "text": "Tevere"},
        {"id": "b", "text": "Arno"},
        {"id": "c", "text": "Po"},
        {"id": "d", "text": "Adige"}
      ],
      "correctAnswer": "c",
      "timeLimit": 30,
      "points": 100,
      "order": 2
    }
  ]
}
```

#### Validazione Schema
- **name**: Stringa obbligatoria, 3-100 caratteri
- **description**: Stringa opzionale, max 500 caratteri
- **category**: Stringa obbligatoria da lista predefinita
- **difficulty**: Enum (EASY, MEDIUM, HARD)
- **questions**: Array di almeno 5 domande, max 50
- **text**: Stringa obbligatoria, 10-500 caratteri
- **options**: Array di esattamente 4 opzioni
- **correctAnswer**: ID di una delle opzioni
- **timeLimit**: Numero 10-60 secondi
- **points**: Numero 50-200 punti

### Integrazione LLM per Generazione Domande

#### Configurazione Provider LLM
```json
{
  "provider": "OPENAI",
  "apiKey": "sk-...", // Criptata nel database
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "model": "gpt-4",
  "maxTokens": 2000,
  "temperature": 0.7
}
```

#### Prompt Template per Generazione
```json
{
  "systemPrompt": "Sei un esperto creatore di quiz. Crea domande a risposta multipla accurate e interessanti.",
  "userPrompt": "Crea {numQuestions} domande di difficoltà {difficulty} sulla categoria {category}. Ogni domanda deve avere 4 opzioni di risposta e una sola corretta. Rispondi SOLO con JSON valido nel formato specificato.",
  "outputFormat": {
    "questions": [
      {
        "text": "Testo della domanda",
        "options": [
          {"id": "a", "text": "Opzione A"},
          {"id": "b", "text": "Opzione B"},
          {"id": "c", "text": "Opzione C"},
          {"id": "d", "text": "Opzione D"}
        ],
        "correctAnswer": "a",
        "explanation": "Spiegazione opzionale della risposta"
      }
    ]
  }
}
```

#### Provider LLM Supportati
1. **OpenAI**
   - Modelli: gpt-4, gpt-3.5-turbo
   - Endpoint: https://api.openai.com/v1/chat/completions
   
2. **Anthropic Claude**
   - Modelli: claude-3-opus, claude-3-sonnet
   - Endpoint: https://api.anthropic.com/v1/messages
   
3. **Google Gemini**
   - Modelli: gemini-pro, gemini-pro-vision
   - Endpoint: https://generativelanguage.googleapis.com/v1/models
   
4. **Custom**
   - Endpoint personalizzabile
   - Supporto per modelli self-hosted
```

## Frontend Web

### Struttura Directory
```
frontend/
├── src/
│   ├── components/      # Componenti React riutilizzabili
│   ├── pages/          # Pagine/Route principali
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services
│   ├── store/          # Redux store
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── styles/         # Global styles/theme
│   ├── App.tsx
│   └── index.tsx
├── public/
├── package.json
└── tsconfig.json
```

### Componenti Principali
- **AuthForm**: Login/Registrazione
- **GameLobby**: Creazione/Join partita
- **GameRoom**: Sala d'attesa pre-partita
- **QuestionDisplay**: Visualizzazione domande
- **AnswerOptions**: Selezione risposte
- **Leaderboard**: Classifica in tempo reale
- **Timer**: Countdown per le risposte
- **PlayerList**: Lista giocatori connessi

#### Nuovi Componenti per Sistema Amicizie
- **FriendsPage**: Pagina principale gestione amicizie
- **FriendSearch**: Componente ricerca utenti
- **FriendRequests**: Lista richieste ricevute/inviate
- **FriendsList**: Lista amici con stato online
- **FriendProfileCard**: Card profilo amico con opzioni
- **InviteFriendModal**: Modal per invitare amici in partita

#### Componenti Premium Features
- **PremiumGameCreator**: Creatore partite personalizzate (premium)
- **QuestionSetEditor**: Editor question set personalizzati
- **BulkQuestionUpload**: Upload massivo domande JSON
- **LLMQuestionGenerator**: Generatore domande via AI
- **LLMProviderConfig**: Configurazione provider LLM
- **SubscriptionManager**: Gestione subscription premium

#### Componenti Pubblicità (Free Users)
- **AdBanner**: Banner ads in-app
- **InterstitialAd**: Ads a schermo intero tra round
- **AdBlockDetector**: Rilevamento ad-blocker
- **UpgradePrompt**: Prompt upgrade a premium

#### Nuovi Componenti Sistema Avatar
- **AvatarSelector**: Selezione avatar con preview
- **AvatarCustomizer**: Editor personalizzazione avatar
- **AvatarGallery**: Galleria avatar disponibili con filtri
- **AvatarPreview**: Anteprima avatar con animazioni
- **UserAvatarCard**: Card profilo utente con avatar
- **AvatarUnlockModal**: Modal sblocco nuovo avatar

#### Componenti Shop e In-App Purchases
- **ShopPage**: Pagina principale shop
- **ShopItemCard**: Card prodotto con prezzo e preview
- **ShopCategories**: Navigazione categorie shop
- **ShoppingCart**: Carrello acquisti
- **PurchaseModal**: Modal conferma acquisto
- **PaymentProcessor**: Gestione pagamenti Stripe/Google Play
- **PurchaseHistory**: Storico acquisti
- **RestorePurchases**: Ripristino acquisti

#### Componenti UI Avanzati
- **AnimatedButton**: Bottoni con micro-animazioni
- **ParticleEffect**: Effetti particelle per celebrazioni
- **GradientCard**: Card con sfondi gradiente animati
- **FloatingActionButton**: FAB con icone animate
- **ProgressRing**: Progress indicator circolare animato
- **PulsingDot**: Indicatore status online animato
- **SlideInNotification**: Toast notification moderne
- **ColorfulSpinner**: Loading spinner a tema cervello

### State Management (Redux) Aggiornato
```typescript
interface RootState {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    subscription: SubscriptionStatus;
  };
  game: {
    currentGame: Game | null;
    players: Player[];
    currentQuestion: Question | null;
    timeRemaining: number;
    leaderboard: LeaderboardEntry[];
  };
  friends: {
    friends: Friend[];
    requests: FriendRequest[];
    sentRequests: FriendRequest[];
    searchResults: User[];
    onlineFriends: string[];
  };
  premium: {
    ownedQuestionSets: QuestionSet[];
    llmConfigs: LLMConfig[];
    currentGenerator: LLMGenerationStatus;
  };
  avatars: {
    availableAvatars: Avatar[];
    ownedAvatars: Avatar[];
    selectedAvatar: Avatar | null;
    customizations: AvatarCustomization[];
    categories: AvatarCategory[];
  };
  shop: {
    items: ShopItem[];
    categories: ShopCategory[];
    cart: CartItem[];
    purchases: Purchase[];
    loading: boolean;
    paymentProcessing: boolean;
  };
  ads: {
    bannerVisible: boolean;
    interstitialReady: boolean;
    impressions: AdImpression[];
  };
  ui: {
    theme: 'light' | 'dark';
    notifications: Notification[];
    animations: {
      particlesEnabled: boolean;
      reducedMotion: boolean;
    };
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}
```

### Theme e Colori Definiti
```typescript
// Design System
export const BRAND_COLORS = {
  primary: {
    yellow: '#FFD700',
    orange: '#FF6943',
    pink: '#FF6993',
    purple: '#8B5CF6',
  },
  secondary: {
    lightYellow: '#FFF3CD',
    lightOrange: '#FFE4DE', 
    lightPink: '#FFEBF0',
    lightPurple: '#F3F0FF',
  },
  neutral: {
    white: '#FFFFFF',
    gray100: '#F7FAFC',
    gray200: '#EDF2F7',
    gray500: '#A0AEC0',
    gray800: '#2D3748',
    black: '#000000',
  },
  success: '#48BB78',
  warning: '#ED8936',
  error: '#F56565',
  info: '#4299E1',
};

export const ANIMATIONS = {
  durations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easings: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};
```

### Routing Aggiornato
```typescript
// Rotte pubbliche
/login
/register
/about

// Rotte autenticate
/dashboard
/game/:gameId
/lobby

// Gestione amicizie
/friends
/friends/search
/friends/requests

// Features premium
/premium/question-sets
/premium/create-game
/premium/llm-config
/premium/subscription

// Admin
/admin/users
/admin/question-sets
/admin/analytics
```

### Dipendenze Frontend
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "@mui/material": "^5.x",
    "@emotion/react": "^11.x",
    "@emotion/styled": "^11.x",
    "@reduxjs/toolkit": "^1.x",
    "react-redux": "^8.x",
    "socket.io-client": "^4.x",
    "axios": "^1.x",
    "react-hook-form": "^7.x",
    "react-query": "^3.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "vite": "^4.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

## App Mobile

### Struttura Directory
```
mobile-app/BrainBrawlerMobile/
├── src/
│   ├── components/      # Componenti React Native
│   ├── screens/        # Schermate dell'app
│   ├── navigation/     # React Navigation setup
│   ├── services/       # API e WebSocket services
│   ├── store/          # Redux store
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utility functions
│   ├── config/         # Configurazioni
│   ├── types/          # TypeScript types
│   └── App.tsx
├── android/            # Android native code
├── ios/               # iOS native code
├── package.json
└── tsconfig.json
```

### Configurazioni Critiche

#### Android
- **Package Name**: `com.brainbrawlermobile`
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 35
- **Compile SDK**: 35

#### File di Configurazione Mobile
1. **src/config/index.ts**
```typescript
const CONFIG = {
  API_BASE_URL: 'http://10.40.10.180/api', // Per sviluppo
  WS_URL: 'ws://10.40.10.180/ws',
  // Per produzione: https://www.brainbrawler.com/api
};
```

2. **android/app/build.gradle**
```gradle
android {
    namespace "com.brainbrawlermobile"
    defaultConfig {
        applicationId "com.brainbrawler.mobile"
        minSdkVersion 24
        targetSdkVersion 35
    }
}
```

### Dipendenze Mobile
```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.76.5",
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@reduxjs/toolkit": "^1.x",
    "react-redux": "^8.x",
    "react-native-screens": "^3.x",
    "react-native-safe-area-context": "^4.x",
    "react-native-gesture-handler": "^2.x",
    "react-native-vector-icons": "^10.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "react-native-webrtc": "^124.x",
    "react-native-permissions": "^3.x",
    "react-native-device-info": "^10.x",
    "react-native-get-random-values": "^1.x",
    "@react-native-community/netinfo": "^11.x",
    
    // Google Mobile Ads per account FREE
    "react-native-google-mobile-ads": "^15.x",
    "@react-native-google-signin/google-signin": "^10.x",
    
    // Gestione amicizie e social
    "react-native-contacts": "^7.x",
    "react-native-share": "^9.x",
    
    // Premium features
    "react-native-document-picker": "^9.x",
    "react-native-fs": "^2.x",
    
    // Networking e API
    "axios": "^1.x",
    "socket.io-client": "^4.x",
    
    // UI Components
    "react-native-elements": "^3.x",
    "react-native-paper": "^5.x",
    "react-native-toast-message": "^2.x",
    "react-native-modal": "^13.x",
    
    // Notifiche push
    "@react-native-firebase/app": "^18.x",
    "@react-native-firebase/messaging": "^18.x",
    
    // Animazioni
    "react-native-reanimated": "^3.x",
    "lottie-react-native": "^6.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-native": "^0.76.x",
    "typescript": "^5.x",
    "metro-config": "^0.80.x",
    "@react-native/metro-config": "^0.76.x"
  }
}
```

### Configurazione Google Mobile Ads

#### android/app/src/main/AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application android:name=".MainApplication">
    <!-- Google Mobile Ads App ID -->
    <meta-data
      android:name="com.google.android.gms.ads.APPLICATION_ID"
      android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
    
    <!-- Google Mobile Ads Test Ads (development only) -->
    <meta-data
      android:name="com.google.android.gms.ads.flag.OPTIMIZE_INITIALIZATION"
      android:value="true"/>
    <meta-data
      android:name="com.google.android.gms.ads.flag.OPTIMIZE_AD_LOADING"
      android:value="true"/>
  </application>
</manifest>
```

#### Configurazione Ad Units
```typescript
// src/config/ads.ts
export const AD_CONFIG = {
  // Test IDs per sviluppo
  BANNER_AD_UNIT_ID: __DEV__ 
    ? 'ca-app-pub-3940256099942544/6300978111' // Test ID
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Production ID
    
  INTERSTITIAL_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712' // Test ID  
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Production ID
    
  REWARDED_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917' // Test ID
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Production ID
};

export const AD_FREQUENCY = {
  INTERSTITIAL_EVERY_N_QUESTIONS: 3,
  MAX_ADS_PER_SESSION: 5,
  MIN_TIME_BETWEEN_ADS: 60000, // 1 minuto
};
```

### Schermate Mobile Aggiornate

#### Autenticazione e Onboarding
- **SplashScreen**: Schermata di avvio con logo
- **OnboardingScreen**: Tutorial primo utilizzo
- **LoginScreen**: Login con validazione
- **RegisterScreen**: Registrazione con scelta account type
- **AccountTypeSelector**: Selezione FREE vs PREMIUM

#### Dashboard e Navigazione
- **DashboardScreen**: Home con quick actions
- **ProfileScreen**: Profilo utente e settings
- **SettingsScreen**: Configurazioni app

#### Gestione Amicizie
- **FriendsScreen**: Lista amici con stato
- **SearchFriendsScreen**: Ricerca e invio richieste
- **FriendRequestsScreen**: Gestione richieste
- **FriendProfileScreen**: Profilo amico con opzioni gioco

#### Gioco
- **GameLobbyScreen**: Lista partite disponibili
- **CreateGameScreen**: Creazione partita (premium)
- **JoinGameScreen**: Join via codice
- **GameWaitingRoomScreen**: Sala d'attesa
- **GamePlayScreen**: Schermata di gioco principale
- **QuestionScreen**: Visualizzazione domanda
- **ResultsScreen**: Risultati round
- **LeaderboardScreen**: Classifica finale

#### Features Premium
- **QuestionSetsScreen**: Gestione question set
- **CreateQuestionSetScreen**: Creazione set
- **QuestionEditorScreen**: Editor singola domanda
- **BulkUploadScreen**: Upload massivo JSON
- **LLMGeneratorScreen**: Generazione via AI
- **LLMConfigScreen**: Configurazione provider
- **SubscriptionScreen**: Gestione abbonamento

#### Pubblicità (Account FREE)
- **AdBannerComponent**: Banner bottom screen
- **InterstitialAdComponent**: Fullscreen tra round
- **UpgradePromptScreen**: Prompt upgrade premium

#### Sistema Avatar e Personalizzazione
- **AvatarSelectionScreen**: Selezione e preview avatar
- **AvatarCustomizationScreen**: Personalizzazione colori e accessori
- **AvatarGalleryScreen**: Galleria completa con filtri categoria
- **AvatarUnlockScreen**: Celebrazione sblocco nuovo avatar
- **ProfileCustomizationScreen**: Setup profilo completo

#### Shop e In-App Purchases
- **ShopHomeScreen**: Homepage shop con categorie
- **ShopCategoryScreen**: Prodotti per categoria
- **ProductDetailScreen**: Dettaglio prodotto con preview
- **ShoppingCartScreen**: Carrello con riepilogo
- **CheckoutScreen**: Processo di pagamento
- **PurchaseConfirmationScreen**: Conferma acquisto
- **PurchaseHistoryScreen**: Storico acquisti
- **RestorePurchasesScreen**: Ripristino acquisti

#### Enhanced UI Screens
- **SplashScreenAnimated**: Splash con animazioni logo
- **OnboardingCarousel**: Tutorial interattivo con animazioni
- **LoadingScreensCustom**: Loading states tematizzati
- **NotificationCenter**: Centro notifiche con preview

## Infrastruttura e DevOps

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.11
    restart: unless-stopped
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--api.dashboard=true"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./traefik/conf:/etc/traefik/conf:ro"
      - "./traefik/certs:/etc/traefik/certs:ro"
    networks:
      - brainbrawler_net

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: brainbrawler
      POSTGRES_PASSWORD: password
      POSTGRES_DB: brainbrawler
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - brainbrawler_net

  redis:
    image: redis:alpine
    restart: unless-stopped
    networks:
      - brainbrawler_net

  backend:
    image: node:20-slim
    restart: unless-stopped
    depends_on:
      - db
      - redis
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`www.brainbrawler.com`) && (PathPrefix(`/api`) || PathPrefix(`/ws`))"
      - "traefik.http.routers.backend-ip.rule=Host(`10.40.10.180`) && (PathPrefix(`/api`) || PathPrefix(`/ws`))"
      - "traefik.http.routers.backend-ip.entrypoints=web"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls=true"
      - "traefik.http.services.backend.loadbalancer.server.port=3000"
    environment:
      - DATABASE_URL=postgresql://brainbrawler:password@db:5432/brainbrawler
      - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
      - JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-too
      - REDIS_URL=redis://redis:6379
      - PORT=3000
      - NODE_ENV=development
      
      # Premium & LLM Features
      - OPENAI_API_KEY=sk-your-openai-key
      - ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
      - GOOGLE_AI_API_KEY=your-google-ai-key
      - LLM_ENCRYPTION_KEY=your-32-char-encryption-key
      
      # Email notifications
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=your-email@gmail.com
      - SMTP_PASSWORD=your-app-password
      
      # Payment processing (Stripe)
      - STRIPE_SECRET_KEY=sk_test_your-stripe-secret
      - STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
      - STRIPE_PREMIUM_PRICE_ID=price_premium_monthly
      
      # File uploads
      - MAX_UPLOAD_SIZE=10MB
      - UPLOAD_PATH=/app/uploads
      
    volumes:
      - ./backend:/app
      - uploads_data:/app/uploads
    working_dir: /app
    command: sh -c "apt-get update && apt-get install -y openssl && npm install && npm run db:generate && npm run dev"
    environment:
      - DATABASE_URL=postgresql://brainbrawler:password@db:5432/brainbrawler
      - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
      - JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-too
      - REDIS_URL=redis://redis:6379
      - PORT=3000
      - NODE_ENV=development
      
      # Premium & LLM Features
      - OPENAI_API_KEY=sk-your-openai-key
      - ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
      - GOOGLE_AI_API_KEY=your-google-ai-key
      - LLM_ENCRYPTION_KEY=your-32-char-encryption-key
      
      # Email notifications
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=your-email@gmail.com
      - SMTP_PASSWORD=your-app-password
      
      # Payment processing (Stripe)
      - STRIPE_SECRET_KEY=sk_test_your-stripe-secret
      - STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
      - STRIPE_PREMIUM_PRICE_ID=price_premium_monthly
      
      # File uploads
      - MAX_UPLOAD_SIZE=10MB
      - UPLOAD_PATH=/app/uploads
      
    volumes:
      - ./backend:/app
      - uploads_data:/app/uploads
```

### Struttura Directory Completa
```
brainbrawler/
├── backend/                 # Backend Node.js (Docker)
├── frontend/               # Frontend React (Docker)  
├── mobile-app/             # Mobile Development (Host Machine)
│   └── BrainBrawlerMobile/ # App React Native (Nativo)
│       ├── android/        # Android native code
│       ├── ios/           # iOS native code (futuro)
│       ├── src/           # React Native source
│       ├── package.json   # Dependencies mobili
│       └── metro.config.js
├── traefik/               # Reverse Proxy (Docker)
│   ├── conf/
│   │   └── dynamic.yml    # Configurazione TLS
│   └── certs/             # Certificati SSL
├── docker-compose.yml     # Solo: traefik, backend, frontend, db, redis
├── README.md
└── docs/                  # Documentazione progetto
    ├── API.md
    ├── DEPLOYMENT.md
    └── MOBILE_SETUP.md
```

### Architettura Deployment Aggiornata
```
┌─────────────┐     HTTPS/WSS      ┌─────────────┐
│   Mobile    │ ◄─────────────────► │             │
│  App (Host) │                     │   Traefik   │
└─────────────┘                     │  (Docker)   │
                                    │             │
┌─────────────┐     HTTPS/WSS      │  Port 80/443│
│     Web     │ ◄─────────────────► │             │
│   Browser   │                     └──────┬──────┘
└─────────────┘                            │
                                           │
                    ┌──────────────────────┴───────────────────┐
                    │                                          │
                    ▼                                          ▼
            ┌───────────────┐                        ┌─────────────────┐
            │    Backend    │                        │    Frontend     │
            │  (Docker)     │                        │   (Docker)      │
            │   Port 3000   │                        │   Port 3001     │
            └───────┬───────┘                        └─────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
┌───────────────┐      ┌─────────────────┐
│  PostgreSQL   │      │      Redis      │
│  (Docker)     │      │   (Docker)      │
└───────────────┘      └─────────────────┘

Host Machine:
┌─────────────────────────────────┐
│  Android Development           │
│  ├── Android Studio           │
│  ├── OpenJDK 17               │
│  ├── Android SDK              │
│  ├── React Native CLI         │
│  └── Metro Bundler            │
└─────────────────────────────────┘
```

### Vantaggi della Separazione

#### Performance
- **Build più veloci**: Niente overhead container per Android
- **Hot reload nativo**: Metro bundler diretto su host
- **Debug migliorato**: Accesso diretto agli strumenti Android

#### Sviluppo
- **IDE integrazione**: Android Studio funziona nativamente
- **Emulatore performance**: AVD gira direttamente sull'hardware
- **Toolchain completo**: Accesso a tutti gli strumenti Android

#### Deployment
- **Stack Docker semplificato**: Solo servizi web
- **Scalabilità**: Separazione chiara delle responsabilità
- **Manutenzione**: Aggiornamenti indipendenti

## Problemi Riscontrati e Soluzioni

### 1. ClassNotFoundException nell'App Mobile
**Problema**: L'app crashava con `java.lang.ClassNotFoundException: Didn't find class "com.brainbrawler.mobile.MainApplication"`

**Causa**: Discrepanza tra il nome del package nelle configurazioni:
- File Java/Kotlin: `com.brainbrawlermobile`
- Configurazione Gradle: `com.brainbrawler.mobile`

**Soluzione**: Allineare tutti i nomi del package a `com.brainbrawler.mobile`

### Fase 4.3: Features Premium
- [ ] Implementa account type selector
- [ ] Crea schermata subscription management
- [ ] Implementa Stripe payment integration
- [ ] Crea custom game creator
- [ ] Implementa question set editor
- [ ] Aggiunge bulk JSON upload
- [ ] Crea LLM integration system
- [ ] Implementa provider configuration

### Fase 4.4: Sistema Avatar e Personalizzazione
- [ ] Design e implementa 20+ avatar base gratuiti
- [ ] Crea 50+ avatar premium per categorie
- [ ] Implementa AvatarSelector con animazioni
- [ ] Crea AvatarCustomizer per colori e accessori
- [ ] Sviluppa sistema di unlocking avatar
- [ ] Implementa preview animati avatar
- [ ] Crea badge e indicatori premium
- [ ] Test personalizzazione completa

### Fase 4.5: Shop e In-App Purchases
- [ ] Setup Google Play Billing API
- [ ] Configura prodotti in Google Play Console
- [ ] Implementa react-native-iap
- [ ] Crea ShopHomeScreen con categorie
- [ ] Sviluppa ProductDetailScreen
- [ ] Implementa ShoppingCart e Checkout
- [ ] Crea sistema validazione acquisti
- [ ] Implementa restore purchases
- [ ] Test completo flusso acquisti

### Fase 4.6: Enhanced UI/UX Design
- [ ] Implementa design system con colori brand
- [ ] Crea componenti UI avanzati con animazioni
- [ ] Sviluppa micro-interazioni e feedback tattile
- [ ] Implementa dark/light mode con transizioni
- [ ] Crea loading states personalizzati
- [ ] Aggiunge effetti particelle per celebrazioni
- [ ] Implementa toast notifications moderne
- [ ] Ottimizza performance animazioni

### Fase 5: Backend Sistema Avatar e Shop
- [ ] Implementa API complete per avatar management
- [ ] Crea sistema di validazione acquisti server-side
- [ ] Sviluppa webhook per Google Play/Apple Store
- [ ] Implementa sistema di inventory utente
- [ ] Crea admin panel per gestione shop
- [ ] Aggiunge analytics acquisti e utilizzo avatar
- [ ] Implementa sistema anti-fraud
- [ ] Crea backup e recovery dati acquisti

### Fase 5.1: Database Performance e Scalabilità
- [ ] Ottimizza query per avatar e shop
- [ ] Implementa caching Redis per shop items
- [ ] Crea indici per performance query avatar
- [ ] Implementa pagination per shop catalog
- [ ] Aggiunge compression per immagini avatar
- [ ] Ottimizza storage per customizations
- [ ] Implementa CDN per assets avatar

### Fase 5.2: Analytics e Business Intelligence
- [ ] Implementa tracking conversioni shop
- [ ] Crea dashboard revenue e KPI
- [ ] Aggiunge A/B testing per shop UI
- [ ] Implementa cohort analysis utenti premium
- [ ] Crea report utilizzo avatar
- [ ] Sviluppa recommendation engine shop
- [ ] Implementa dynamic pricing (futuro)
```

### Testing Commands
```bash
# Test mobile app with ads
npx react-native run-android --variant=debug

# Test premium features
npm run test:premium

# Test friendship system
npm run test:friends

# Load test with multiple users
npm run test:load -- --users 100

# Test avatar system
npm run test:avatars

# Test shop functionality
npm run test:shop

# Test in-app purchases (with test products)
npm run test:purchases
```

### Avatar Management
```bash
# Generate avatar assets
npm run generate:avatars

# Optimize avatar images
npm run optimize:images

# Upload avatars to CDN
npm run upload:avatars

# Test avatar loading performance
npm run test:avatar-performance

# Validate avatar metadata
npm run validate:avatars
```

### Shop and Purchases
```bash
# Validate Google Play products
curl -X GET http://localhost:3000/api/shop/validate-products \
  -H "Authorization: Bearer <admin-token>"

# Test purchase flow
curl -X POST http://localhost:3000/api/shop/purchase \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId": "avatar_premium_pack_animals", "platform": "GOOGLE_PLAY"}'

# Verify purchase
curl -X POST http://localhost:3000/api/shop/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "GPA.1234.5678", "receipt": "..."}'

# Check user purchases
curl -X GET http://localhost:3000/api/shop/purchases \
  -H "Authorization: Bearer <token>"
```

### UI/UX Testing
```bash
# Test animations performance
npm run test:animations

# Validate color accessibility
npm run test:accessibility

# Test responsive design
npm run test:responsive

# Check loading times
npm run test:performance

# Validate dark/light themes
npm run test:themes
```

### Asset Management
```bash
# Compress images
imagemin src/assets/avatars/* --out-dir=src/assets/avatars/compressed

# Generate app icons
npm run generate:icons

# Optimize animations
npm run optimize:lottie

# Validate asset integrity
npm run validate:assets
```

### Development Workflow Completo
```bash
# 1. Avvia stack completo
cd brainbrawler

# Stack Docker (backend, frontend, db, redis)
docker-compose up -d

# Metro bundler per mobile
cd mobile-app/BrainBrawlerMobile
npx react-native start

# 2. Sviluppo parallelo
# Terminal 1: Backend development
cd backend && npm run dev

# Terminal 2: Frontend development  
cd frontend && npm start

# Terminal 3: Mobile development
cd mobile-app/BrainBrawlerMobile && npx react-native run-android

# 3. Testing integrato
npm run test:integration

# 4. Build production
npm run build:all
```

---

**Ultimo aggiornamento**: 08 Luglio 2024 (Aggiornato con Sistema Avatar, Shop e Design Moderno)
**Autore**: Assistant AI con l'utente BB
**Versione**: 3.0 - Include Sistema Avatar, In-App Purchases, UI/UX Moderna e Responsive
**Logo**: BrainBrawler - Icona cervello rosa su sfondo giallo con design accattivante