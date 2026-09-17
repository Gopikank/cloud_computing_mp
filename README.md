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

npm install -g firebase-tools
firebase login


### 4. Connect this folder
From the project folder:

firebase use --add


### 5. Deploy rules

firebase deploy --only firestore:rules,storage


### 6. Deploy hosting

firebase deploy --only hosting

### 7. Optional scheduled Cloud Function

cd functions
npm install
cd ..
firebase deploy --only functions


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


## Sample input and output

### Sample input


Role: setter
File: sample-question-paper.txt
Content: What is cloud computing?
Title: Cloud Computing Midterm
Exam start: 10:00 AM
Public release: 1:00 PM


### Expected output

| User/time | Result |
|---|---|
| Setter after upload | `Locked — setters cannot access submitted content.` |
| Admin at 9:57 AM | Paper remains locked |
| Admin at 9:58 AM | Open/download and verification are allowed |
| Student at 9:59 AM | Paper remains locked |
| Student at 10:00 AM | Open/download and verification are allowed |
| Public at 1:00 PM | Paper is available |

Successful integrity checking displays:


Integrity verified: SHA-256 matches.

## Cloud computing concepts demonstrated
- Cloud storage
- Cloud database
- Cloud authentication
- Serverless computing
- Security rules / access control
- Audit logging
- Scheduled cloud automation
- Managed cloud hosting

