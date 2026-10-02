# Unipop | Student Marketplace App

I architected an app similar to Depop/OfferUp but for college students only. Students can post listing such as textbooks or dorm furniture, DM only students from their school, and meet up somewhere on campus to exchange.

## What it does

- You sign up with your **.edu email** and you have to be **18+**
- Set your school's domain (like `charlotte.edu`) so you can't see listings from other schools. So a student at UNC Charlotte will never sees a Harvard student's mini fridge
- You can post furniture, textbooks, clothes, shoes, tickets, even apartment leases (you're welcome, seniors)
- Up to 10 photos per listing, picked straight from your phone
- Message the seller, save stuff you like, meet up, deal done

## Tech stack

**Backend**

- Java 21 + Spring Boot (Web, Data JPA, Security, Validation)
- JWT for authentification
- PostgreSQL for the database

**Frontend**

- React 18 + Vite + Tailwind CSS v4
- react-router for the pages

## How to run it

You'll need PostgreSQL on your machine with a database called `ninermarket`.

### 1. Backend (runs on port 8080)

```bash
cd backend
# first time: copy the example config and put your own DB password in it
cp src/main/resources/application.properties.example src/main/resources/application.properties
./mvnw spring-boot:run
```

> Heads up: `application.properties` is **not** in this repo because it has my real DB password and JWT secret in it. The `.example` file has the same setup with dummy values — just swap in your own.

### 2. Frontend (runs on port 5173)

```bash
cd frontend
npm install
npm run dev
```

Then just open http://localhost:5173. The API defaults to `http://localhost:8080/api`, but you can override that with a `VITE_API_BASE` env var if you're running it somewhere else.

## Some rules I built in

**Signing up**

- `.edu` emails only — checked on the frontend _and_ the backend, so you can't just fake it with dev tools
- Must be 18+, date of birth required
- Username has to be unique, password at least 8 characters

**Campus-only**

- Your email domain becomes your `schoolDomain`
- Every single product query gets filtered to your domain (`ProductService.sameCampus`), even if you try to hit `/api/products/{id}` directly
- Messaging is locked to your school too. No cross-campus communication

**Listings**

- Categories come from `GET /api/categories`: Clothes (with sub-types like Shirts, Pants, Outerwear, Dresses... plus Mens/Womens/Unisex and sizes), Shoes, Hats, Jewelry, Accessories, Books, School Gear, Electronics, Bikes, Home Goods, Furniture, Tickets, Leases, Other
- Every listing has a condition: `NEW`, `GOOD`, or `POOR`
- Up to 10 photos, uploaded as base64 data-urls and stored in the `product_images` table
- You can filter by category, subcategory, department, size, condition, price range, and search

**Messaging**

- `GET/POST /api/conversations` and `GET/POST /api/conversations/{id}/messages`
- `POST /api/conversations/{id}/read` for marking stuff read
- Your inbox shows the other person, the listing, the last message, and your unread count

**Saving stuff**

- `GET /api/saved`, `POST /api/saved/{productId}`, `DELETE /api/saved/{productId}`
- Saved items show up on the Saved page and as a filled heart everywhere

**Account stuff (the tricky part)**

- Your **userID is permanent** — `User.setId` refuses to change it and the client can never send one
- You can only change your username, email, or password **once every 14 days** (`UserService.CHANGE_LOCK`). The profile page locks the fields and shows you the unlock date
- If you change your email it still has to be `.edu` and it re-derives your campus

## API cheat sheet

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

## Things I'd fix furthermore

- Real-time messaging (right now you have to refresh to see new messages)
- Push notifications
- Email verification
