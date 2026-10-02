# Unipop — peer-to-peer student marketplace

Unipop is a Depop/OfferUp/Facebook-Marketplace style marketplace built **only for university students**.
Students buy and sell dorm furniture, textbooks, school gear, tickets and apartment leases —
**there is no in-app checkout**: buyers message the seller and the two meet in person on campus.

## Stack

- **Backend:** Java 21, Spring Boot (Web, Data JPA, Security, Validation), JWT auth, PostgreSQL
- **Frontend:** React 18 + Vite + Tailwind CSS v4, react-router

## Running

### 1. Backend (port 8080)

```bash
cd backend
# requires a local PostgreSQL with a database named "ninermarket"
# (credentials live in src/main/resources/application.properties)
./mvnw spring-boot:run
```

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — API base URL defaults to `http://localhost:8080/api`
(override with `VITE_API_BASE`).

## Feature map

### Sign-up rules

- **`.edu` emails only** — validated on the client (Register page) and again on the
  server (`RegisterRequestDto` pattern + `AuthController`).
- **18+ only** — date of birth is required and checked against the current date.
- Username must be unique; password minimum 8 characters.

### Campus scoping

- The email domain becomes the student's `schoolDomain` (e.g. `charlotte.edu`).
- **Every product query is filtered to the caller's domain** (`ProductService.sameCampus`),
  so a `@charlotte.edu` student never sees `@harvard.edu` listings — including direct
  `/api/products/{id}` lookups.
- Messaging is likewise limited to students at the same school.

### Products

- Categories served from `GET /api/categories`:
  `Clothes` (sub-types: Shirts, Pants, Shorts, Outerwear, Athletic, Dresses, Other —
  with Mens/Womens/Unisex departments and apparel sizes), `Shoes`, `Hats`, `Jewelry`,
  `Accessories`, `Books`, `School Gear`, `Electronics`, `Bikes`, `Home Goods`,
  `Furniture`, `Tickets`, `Leases`, `Other`.
- **Condition** on every listing: `NEW`, `GOOD`, `POOR`.
- **Images**: up to 10 photos per listing, uploaded from the Sell form as base64
  data-urls and stored in the `product_images` table.
- Filters: category, subcategory, department, size, condition, price range, search.
- No cart / no purchase endpoints — the only actions are _Message seller_ and _Save_.

### Messaging / inbox

- `GET/POST /api/conversations`, `GET/POST /api/conversations/{id}/messages`,
  `POST /api/conversations/{id}/read`.
- Conversation list shows the other student, the listing, last message and unread count.

### Saved listings

- `GET /api/saved`, `POST /api/saved/{productId}`, `DELETE /api/saved/{productId}` —
  hearted listings appear on the **Saved** page and show a filled heart everywhere else.

### Account rules

- **userID is permanent** — `User.setId` refuses changes and IDs are never accepted
  from the client.
- **Username, email and password can be edited once every 14 days**
  (`UserService.CHANGE_LOCK`); the Profile page disables the fields and shows the
  unlock date while locked.
- Email changes keep the `.edu` requirement and re-derive the campus domain.

### API overview

| Method         | Path                               | Notes                                |
| -------------- | ---------------------------------- | ------------------------------------ |
| POST           | `/api/auth/register`               | `.edu` + 18+ enforced, returns JWT   |
| POST           | `/api/auth/login`                  | returns JWT + profile                |
| GET            | `/api/products`                    | campus-scoped, filter query params   |
| GET/PUT/DELETE | `/api/products/{id}`               | owner-only mutations                 |
| GET            | `/api/categories`                  | category tree + conditions           |
| GET            | `/api/users/{id}`                  | profile incl. 14-day lock timestamps |
| PUT            | `/api/users/{id}`                  | username/email lock enforced         |
| PATCH          | `/api/users/{id}/password`         | password lock enforced               |
| GET            | `/api/conversations`               | inbox list                           |
| POST           | `/api/conversations/{id}/messages` | send message                         |
| GET            | `/api/saved`                       | saved listings                       |
