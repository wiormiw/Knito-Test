# Knito-Test
## Pre-install
- Ask .env file to creator!

## Instalation & Run
### 1. Prepare docker images for running app in development
   
```bash
docker compose up -d postgres  maildev
```

### 2. Install dependencies
   
```bash
npm install
```

### 3. Run DB migrations
   
```bash
npm run migration:run
```

### 4. Run DB seeding (initial data)

```bash
npm run seed:run:relational
```

### 5. Run app in dev environment

```bash
npm run start:dev
```

### 6. Go to http://localhost:3000/docs

## About Apps & API:
### Example default login (api/v1/auth/email/login) payload:
```json
{
  "email": "admin@example.com",
  "password": "admin"
}
```

### Alternative login using google:
1. Go to: https://developers.google.com/oauthplayground/
2. Select: Google OAuth2 API v2
3. Select: https://www.googleapis.com/auth/userinfo.email
4. Click gear icon (in top right)
5. Check ✅ Use your own OAuth credentials
6. COPY OAuth Client ID & Client Secret from .env
7. Exchange authorization code for tokens
   ```json
   {
    "id_token": "string of id token" // Search for this in google response payload
   }
   ```
8. Paste the id token in swagger endpoint(api/v1/auth/google/login) as a payload
   ```json
   {
    "idToken": "string of id token in step 7"
   }
   ```

### Example register payload:
```json
{
  "email": "userbarufromregister@example.com",
  "password": "userbarubaru",
  "firstName": "User",
  "lastName": "Baru From Register Endpoint"
}
```

### Example create user payload
```json
{
  "email": "akuuserbaru@example.com",
  "password": "akuuserbarupw",
  "firstName": "Aku",
  "lastName": "User Baru",
  "role": {
    "id": 2 // Role User
  },
  "status": {
    "id": 1 // Status Active
  }
}
```

### Example params for sorting user
```json
[{"orderBy":"createdAt","order":"DESC"}]
```

### Example order payload (LOGIN AS ADMIN)
```json
{
  "totalAmount": 100087, // Total Amount needs to match products price
  "userId": 1,
  "products": [
    {"id": 5}, // Arrays of Products id
    {"id": 6}
  ]
}
```