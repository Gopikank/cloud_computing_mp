# Cloud-Based Examination Question Paper Vault


## Core idea
Question papers are stored in Firebase Cloud Storage, metadata is stored in Cloud Firestore, users authenticate with Firebase Authentication, access is role-based, papers require admin approval, and papers can be released only after the configured exam time. Audit logs record important actions. SHA-256 is used as an integrity fingerprint.

## Technologies
- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Storage
- Firebase Hosting
- Firebase Cloud Functions (optional scheduled release)
- Firestore and Storage Security Rules
- HTML, CSS, JavaScript
- Browser Web Crypto API (SHA-256)

## Important security note
This is an educational prototype, not a production examination system. Firebase provides encryption in transit and at rest, but this project does not implement custom AES key management. Do not upload real confidential examination papers.

## Project structure
```text
cloud-exam-paper-vault/
├── public/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── functions/
│   ├── index.js
│   └── package.json
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc.example
└── README.md
```

## Setup

### 1. Create Firebase project
In Firebase Console create a project and enable:
- Authentication -> Email/Password
- Firestore Database
- Storage
- Hosting

Create a Web App and copy its Firebase configuration.

### 2. Configure frontend
Open `public/app.js` and replace the values in `firebaseConfig` with your Firebase Web App configuration.

Do not put a service-account JSON file in this project or GitHub.

### 3. Install Firebase CLI
```cmd
npm install -g firebase-tools
firebase login
```

### 4. Connect this folder
From the project folder:
```cmd
firebase use --add
```
Choose your Firebase project.

### 5. Deploy rules
```cmd
firebase deploy --only firestore:rules,storage
```

### 6. Deploy hosting
```cmd
firebase deploy --only hosting
```

### 7. Optional scheduled Cloud Function
```cmd
cd functions
npm install
cd ..
firebase deploy --only functions
```

`releaseDuePapers` runs every 5 minutes and changes approved papers from `SCHEDULED` to `RELEASED` when their exam time arrives.

Scheduled Cloud Functions may require a billing-enabled Firebase/Google Cloud project depending on current Google Cloud requirements. For a no-billing classroom demo, use the app's **Run Release Check** button instead.

## Demo workflow

### Question Setter
1. Register/login as Question Setter.
2. Enter paper title and exam time a few minutes ahead.
3. Upload a PDF/TXT file.
4. The paper becomes `PENDING_APPROVAL`.

### Admin
1. Login as Admin.
2. Click Approve.
3. The paper becomes `SCHEDULED`.

### Before release
The paper remains locked:
`ACCESS LOCKED`

### Release
Click **Run Release Check** when the demo time arrives, or let the scheduled Cloud Function perform the release.

### Examiner
After release, login as Examiner and open the paper.

### Integrity
Use **Verify Hash** after release. The application downloads the authorized file and calculates SHA-256 again. A match indicates the stored file is unchanged.

## Sample result
```text
Before exam:
Status: SCHEDULED
Access: LOCKED

After exam time:
Status: RELEASED
Access: ALLOWED
```

## Cloud computing concepts demonstrated
- Cloud storage
- Cloud database
- Cloud authentication
- Serverless computing
- Security rules / access control
- Audit logging
- Scheduled cloud automation
- Managed cloud hosting

