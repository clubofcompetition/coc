// Firebase configuration details
const firebaseConfig = {
    apiKey: "AIzaSyBWCmDysQ-oTPK48ukm3HlxZV4XLsVckwk",
    authDomain: "coc-cat.firebaseapp.com",
    projectId: "coc-cat",
    storageBucket: "coc-cat.firebasestorage.app",
    messagingSenderId: "152265934196",
    appId: "1:152265934196:web:d799d62c8aeafca011d821",
    measurementId: "G-CDWJVT35XC"
};

// Initialize Firebase using compat libraries
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();