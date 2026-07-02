import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// ⚠️ ដាក់ Firebase Config របស់លោកអ្នកនៅទីនេះ ⚠️
// សូមចូលទៅកាន់ console.firebase.google.com -> Project Settings ដើម្បីចម្លង (Copy) វាមកដាក់ទីនេះ
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyC6vARDpsdRu3LQ2_gT5fC7vQv4x6EFUr0",
  authDomain: "khmerpicker.firebaseapp.com",
  projectId: "khmerpicker",
  storageBucket: "khmerpicker.firebasestorage.app",
  messagingSenderId: "400303660123",
  appId: "1:400303660123:web:6780a2ca0cf4292d30b37e",
  measurementId: "G-13T3F9KQKS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// DOM Elements
const authModal = document.getElementById('auth-modal');
const closeAuthBtn = document.getElementById('close-auth-btn');
const navLoginBtn = document.getElementById('nav-login');
const navLoginText = navLoginBtn.querySelector('span');

const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authGoogleBtn = document.getElementById('auth-google-btn');
const authSwitchMode = document.getElementById('auth-switch-mode');
const authTitle = document.getElementById('auth-title');
const authLogoutBtn = document.getElementById('auth-logout-btn');

let isLoginMode = true;
let currentUser = null;

// Modal Toggles
navLoginBtn.addEventListener('click', () => {
    authModal.classList.remove('hidden');
});

closeAuthBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
});

// Switch between Login and Register
authSwitchMode.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if(isLoginMode) {
        authTitle.innerHTML = '<i class="fa-solid fa-user-lock"></i> ចូលគណនី';
        authSubmitBtn.innerText = 'ចូលប្រើប្រាស់';
        authSwitchMode.innerText = 'ចុះឈ្មោះទីនេះ';
    } else {
        authTitle.innerHTML = '<i class="fa-solid fa-user-plus"></i> បង្កើតគណនីថ្មី';
        authSubmitBtn.innerText = 'ចុះឈ្មោះ';
        authSwitchMode.innerText = 'មានគណនីរួចហើយ? ចូលទីនេះ';
    }
});

// Email/Password Auth
authSubmitBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    
    if(!email || !password) {
        alert("សូមបញ្ចូលអ៊ីមែល និងលេខសម្ងាត់!");
        return;
    }
    
    if(firebaseConfig.apiKey === "YOUR_API_KEY") {
        alert("សូម Setup Firebase Config នៅក្នុង File firebase-app.js ជាមុនសិន!");
        return;
    }
    
    try {
        if(isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        authModal.classList.add('hidden');
        authEmail.value = '';
        authPassword.value = '';
    } catch(error) {
        alert("មានបញ្ហា៖ " + error.message);
    }
});

// Google Auth
authGoogleBtn.addEventListener('click', async () => {
    if(firebaseConfig.apiKey === "YOUR_API_KEY") {
        alert("សូម Setup Firebase Config នៅក្នុង File firebase-app.js ជាមុនសិន!");
        return;
    }
    try {
        await signInWithPopup(auth, googleProvider);
        authModal.classList.add('hidden');
    } catch(error) {
        alert("មិនអាចចូលប្រើ Google បានទេ៖ " + error.message);
    }
});

// Logout
authLogoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        authModal.classList.add('hidden');
    } catch(error) {
        console.error(error);
    }
});

// Listen to Auth State Changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        navLoginText.innerText = user.email.split('@')[0];
        authLogoutBtn.classList.remove('hidden');
        document.getElementById('auth-login-view').style.display = 'none';
        authTitle.innerText = "គណនីរបស់អ្នក";
        
        // Load data from Cloud
        await loadDataFromCloud(user.uid);
    } else {
        currentUser = null;
        navLoginText.innerText = 'ចូលគណនី';
        authLogoutBtn.classList.add('hidden');
        document.getElementById('auth-login-view').style.display = 'block';
        authTitle.innerHTML = '<i class="fa-solid fa-user-lock"></i> ចូលគណនី';
    }
});

// Database Sync Functions
async function loadDataFromCloud(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.classes && window.syncDataFromCloud) {
                window.syncDataFromCloud(data.classes);
            }
        }
    } catch(error) {
        console.error("Error loading data:", error);
    }
}

async function saveDataToCloud(classes) {
    if(!currentUser) return; // Only save if logged in
    
    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            classes: classes,
            updatedAt: new Date()
        }, { merge: true });
    } catch(error) {
        console.error("Error saving data:", error);
    }
}

// Expose saving function to window so script.js can call it
window.FirebaseManager = {
    saveData: saveDataToCloud
};
