# Fridge2Plate Expiry - Setup Guide

## 1. Firebase Project Setup

1. Go to https://console.firebase.google.com
2. Click "Create a project" (or use an existing one)
3. Name it something like "fridge2plate-expiry"
4. Enable Google Analytics (optional)

### Enable Authentication
1. Go to Authentication > Sign-in method
2. Enable "Email/Password" provider

### Create Firestore Database
1. Go to Firestore Database > Create database
2. Choose "Start in production mode"
3. Select your preferred region
4. Deploy security rules: `firebase deploy --only firestore:rules`

### Enable Cloud Storage
1. Go to Storage > Get started
2. Choose production mode
3. Deploy storage rules: `firebase deploy --only storage`

### Get Web App Config (for mobile)
1. Go to Project Settings > General
2. Click "Add app" > Web
3. Register app (name: "Fridge2Plate Mobile")
4. Copy the config values into `mobile/.env`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Get Service Account Key (for backend)
1. Go to Project Settings > Service accounts
2. Click "Generate new private key"
3. Save the JSON file as `backend/serviceAccountKey.json`
4. Also set the env vars in `backend/.env`:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 2. Google Cloud Vision API Setup

1. Go to https://console.cloud.google.com
2. Select the same project as your Firebase project
3. Go to APIs & Services > Library
4. Search for "Cloud Vision API" and enable it
5. The service account key from Firebase already has the necessary credentials
6. Set in `backend/.env`:

```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

## 3. Running the App

### Backend
```bash
cd backend
cp .env.example .env
# Fill in your Firebase and Google Cloud credentials in .env
npm run dev
# Test: curl http://localhost:3000/api/health
```

### Mobile
```bash
cd mobile
cp .env.example .env
# Fill in your Firebase web app config in .env
npx expo start
# Scan the QR code with Expo Go app
```

### Cloud Functions
```bash
cd cloud-functions
npm run build
# Deploy: firebase deploy --only functions
```

## 4. Testing the OCR

Once the backend is running with valid Google Cloud Vision credentials:

```bash
# Test with a food label image
curl -X POST http://localhost:3000/api/scan \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "images=@/path/to/food-label.jpg"
```

The OCR extracts text using Google Cloud Vision's TEXT_DETECTION, then:
- Searches for expiry keywords (Best Before, Use By, Exp, BB, Sell By)
- Matches dates in multiple formats (DD/MM/YYYY, YYYY-MM-DD, DD MMM YYYY, etc.)
- Falls back to the furthest-future date if no keyword is found
- Extracts product name from the first significant non-noise text line
