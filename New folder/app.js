// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9O1-QzrMD8c6bkifwMlzneLTU8eB4PH8",
    authDomain: "login-coc.firebaseapp.com",
    projectId: "login-coc",
    storageBucket: "login-coc.appspot.com",
    messagingSenderId: "793350174008",
    appId: "1:793350174008:web:47f655787f71f4e852bdcd",
    measurementId: "G-9F5XW0QKCV"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.getAuth(app);
const provider = new firebase.GoogleAuthProvider();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const logoutBtn = document.getElementById('logout-btn');
const welcomeUserEl = document.getElementById('welcome-user');
const startBtn = document.getElementById('start-btn');
const historyBtn = document.getElementById('history-btn');
const submitBtn = document.getElementById('submit-btn');
const restartBtn = document.getElementById('restart-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const questionsContainer = document.getElementById('questions-container');
const timerEl = document.getElementById('timer');
const finalScoreEl = document.getElementById('final-score');
const timeTakenEl = document.getElementById('time-taken');
const scoreProgress = document.getElementById('score-progress');
const answersReviewEl = document.getElementById('answers-review');
const testsCompletedEl = document.getElementById('tests-completed');
const averageScoreEl = document.getElementById('average-score');
const highestScoreEl = document.getElementById('highest-score');
const testsProgress = document.getElementById('tests-progress');
const testsRemainingEl = document.getElementById('tests-remaining');
const historyModal = document.getElementById('history-modal');
const closeHistoryBtn = document.getElementById('close-history-btn');
const historyListEl = document.getElementById('history-list');
const darkModeToggle = document.getElementById('darkModeToggle');
const themeLabel = document.getElementById('theme-label');

// App state
const MAX_TESTS = 500;
let appState = {
    currentUser: null,
    quizState: {
        questions: [],
        userAnswers: {},
        score: 0,
        timeLeft: 60,
        timerInterval: null,
        startTime: null,
        endTime: null
    }
};

// Initialize the app
function init() {
    loadState();
    setupEventListeners();
    
    // Set up auth state listener
    firebase.onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            const userId = user.uid;
            const userData = loadUserData(userId) || {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                history: []
            };
            
            appState.currentUser = {
                uid: userId,
                ...userData
            };
            
            saveUserData(userId, userData);
            saveState();
            
            // Update welcome message
            welcomeUserEl.textContent = `Welcome, ${user.displayName || 'User'}!`;
            
            // Show start screen
            showStartScreen();
        } else {
            // User is signed out
            appState.currentUser = null;
            saveState();
            showLoginScreen();
        }
    });
    
    // Set initial theme
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
        themeLabel.textContent = 'Light';
    } else {
        themeLabel.textContent = 'Dark';
    }
}

// Load user data from localStorage
function loadUserData(userId) {
    const userData = localStorage.getItem(`user_${userId}`);
    return userData ? JSON.parse(userData) : null;
}

// Save user data to localStorage
function saveUserData(userId, data) {
    localStorage.setItem(`user_${userId}`, JSON.stringify(data));
}

// Load saved state from localStorage
function loadState() {
    const savedState = localStorage.getItem('mathQuizApp');
    if (savedState) {
        appState = JSON.parse(savedState);
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('mathQuizApp', JSON.stringify(appState));
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Set up event listeners
function setupEventListeners() {
    // Google Sign-In button
    googleSignInBtn.addEventListener('click', signInWithGoogle);
    
    // Logout button
    logoutBtn.addEventListener('click', signOutUser);
    
    // Quiz navigation buttons
    startBtn.addEventListener('click', startQuiz);
    historyBtn.addEventListener('click', showHistory);
    submitBtn.addEventListener('click', submitQuiz);
    restartBtn.addEventListener('click', startQuiz);
    backToHomeBtn.addEventListener('click', () => {
        resultsScreen.classList.remove('active');
        startScreen.classList.add('active');
    });
    
    // History modal
    closeHistoryBtn.addEventListener('click', () => historyModal.style.display = 'none');
    
    // Theme toggle
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });
}

// Sign in with Google
function signInWithGoogle() {
    firebase.signInWithPopup(auth, provider)
        .catch((error) => {
            console.error('Error signing in with Google:', error);
            alert('Error signing in with Google. Please try again.');
        });
}

// Sign out
function signOutUser() {
    firebase.signOut(auth)
        .then(() => {
            appState.currentUser = null;
            saveState();
            showLoginScreen();
        })
        .catch((error) => {
            console.error('Error signing out:', error);
        });
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeLabel.textContent = isDarkMode ? 'Light' : 'Dark';
    saveState();
}

// Show login screen
function showLoginScreen() {
    loginScreen.classList.add('active');
    startScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
}

// Show start screen
function showStartScreen() {
    loginScreen.classList.remove('active');
    startScreen.classList.add('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    
    // Update stats
    updateStatsUI();
}

// Update stats UI
function updateStatsUI() {
    const currentUser = appState.currentUser;
    const history = currentUser.history || [];
    const testsTaken = history.length;
    const testsRemaining = MAX_TESTS - testsTaken;
    
    testsCompletedEl.textContent = testsTaken;
    testsRemainingEl.textContent = testsRemaining;
    
    // Update progress bar
    const progressPercentage = (testsTaken / MAX_TESTS) * 100;
    testsProgress.style.width = `${progressPercentage}%`;
    
    // Disable start button if max tests reached
    if (testsTaken >= MAX_TESTS) {
        startBtn.disabled = true;
        startBtn.innerHTML = '<span>⛔</span> Test Limit Reached';
    } else {
        startBtn.disabled = false;
        startBtn.innerHTML = '<span>✏️</span> Start New Quiz';
    }
    
    if (testsTaken > 0) {
        const totalScore = history.reduce((sum, test) => sum + test.score, 0);
        const averageScore = Math.round(totalScore / testsTaken);
        const highestScore = Math.max(...history.map(test => test.score));
        
        averageScoreEl.textContent = averageScore;
        highestScoreEl.textContent = highestScore;
    } else {
        averageScoreEl.textContent = '0';
        highestScoreEl.textContent = '0';
    }
}

// Start a new quiz
function startQuiz() {
    // Check if max tests reached
    if (appState.currentUser.history?.length >= MAX_TESTS) {
        alert('You have reached the maximum limit of 500 tests.');
        return;
    }

    // Reset quiz state
    appState.quizState = {
        questions: generateQuestions(),
        userAnswers: {},
        score: 0,
        timeLeft: 60,
        timerInterval: null,
        startTime: null,
        endTime: null
    };
    
    // Update UI
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    resultsScreen.classList.remove('active');
    
    displayQuestions();
    startTimer();
}

// Generate 20 multiplication questions (1-20 tables × 1-10)
function generateQuestions() {
    const questions = [];
    
    for (let i = 0; i < 20; i++) {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 * num2;
        
        const options = generateOptions(answer);
        
        questions.push({
            text: `${num1} × ${num2} = ?`,
            answer: answer,
            options: options
        });
    }
    
    return questions;
}

// Generate answer options
function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    
    while (options.length < 4) {
        const offset = Math.floor(Math.random() * 5) + 1;
        const direction = Math.random() < 0.5 ? -1 : 1;
        let wrongAnswer = correctAnswer + (offset * direction);
        
        if (wrongAnswer <= 0) {
            wrongAnswer = correctAnswer + offset;
        }
        
        if (!options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }
    
    return options.sort(() => Math.random() - 0.5);
}

// Display questions in the UI
function displayQuestions() {
    questionsContainer.innerHTML = '';
    
    appState.quizState.questions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = `${index + 1}. ${question.text}`;
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options';
        
        question.options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            
            // Check if this option was previously selected
            if (appState.quizState.userAnswers[index] === option) {
                optionElement.classList.add('selected');
            }
            
            optionElement.addEventListener('click', () => {
                // Remove selected class from all options
                optionsContainer.querySelectorAll('.option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                optionElement.classList.add('selected');
                
                // Save the selected answer
                appState.quizState.userAnswers[index] = option;
            });
            
            optionsContainer.appendChild(optionElement);
        });
        
        questionCard.appendChild(questionText);
        questionCard.appendChild(optionsContainer);
        questionsContainer.appendChild(questionCard);
    });
}

// Start the quiz timer
function startTimer() {
    if (appState.quizState.timerInterval) {
        clearInterval(appState.quizState.timerInterval);
    }
    
    appState.quizState.startTime = new Date();
    appState.quizState.timeLeft = 60;
    
    updateTimerDisplay();
    
    appState.quizState.timerInterval = setInterval(() => {
        appState.quizState.timeLeft--;
        updateTimerDisplay();
        
        if (appState.quizState.timeLeft <= 10) {
            timerEl.classList.add('warning');
        }
        
        if (appState.quizState.timeLeft <= 0) {
            submitQuiz(true);
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(appState.quizState.timeLeft / 60);
    const seconds = appState.quizState.timeLeft % 60;
    timerEl.textContent = `⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Submit the quiz
function submitQuiz(isTimeUp = false) {
    if (appState.quizState.timerInterval) {
        clearInterval(appState.quizState.timerInterval);
        appState.quizState.timerInterval = null;
    }
    
    appState.quizState.endTime = new Date();
    
    appState.quizState.score = 0;
    appState.quizState.questions.forEach((question, index) => {
        if (appState.quizState.userAnswers[index] === question.answer) {
            appState.quizState.score += 5;
        }
    });
    
    const timeTaken = Math.floor((appState.quizState.endTime - appState.quizState.startTime) / 1000);
    
    if (!appState.currentUser.history) {
        appState.currentUser.history = [];
    }
    
    appState.currentUser.history.push({
        score: appState.quizState.score,
        timeTaken: timeTaken,
        date: new Date().toISOString(),
        isTimeUp: isTimeUp
    });
    
    // Save user data
    saveUserData(appState.currentUser.uid, {
        displayName: appState.currentUser.displayName,
        email: appState.currentUser.email,
        photoURL: appState.currentUser.photoURL,
        history: appState.currentUser.history
    });
    
    saveState();
    showResults(isTimeUp, timeTaken);
}

// Show quiz results
function showResults(isTimeUp, timeTaken) {
    quizScreen.classList.remove('active');
    resultsScreen.classList.add('active');
    
    finalScoreEl.textContent = appState.quizState.score;
    timeTakenEl.textContent = timeTaken;
    scoreProgress.style.width = `${appState.quizState.score}%`;
    
    answersReviewEl.innerHTML = '';
    appState.quizState.questions.forEach((question, index) => {
        const userAnswer = appState.quizState.userAnswers[index];
        const isCorrect = userAnswer === question.answer;
        
        const answerItem = document.createElement('div');
        answerItem.className = 'answer-item';
        
        const questionText = document.createElement('p');
        questionText.innerHTML = `<strong>Question ${index + 1}:</strong> ${question.text}`;
        
        const userAnswerText = document.createElement('p');
        userAnswerText.className = isCorrect ? 'correct' : 'incorrect';
        userAnswerText.textContent = `Your answer: ${userAnswer !== undefined ? userAnswer : 'Not answered'} (${isCorrect ? '✓ Correct' : '✗ Incorrect'})`;
        
        answerItem.appendChild(questionText);
        answerItem.appendChild(userAnswerText);
        
        if (!isCorrect) {
            const correctAnswerText = document.createElement('p');
            correctAnswerText.className = 'correct';
            correctAnswerText.textContent = `Correct answer: ${question.answer}`;
            answerItem.appendChild(correctAnswerText);
        }
        
        answersReviewEl.appendChild(answerItem);
    });
    
    updateStatsUI();
}

// Show history modal
function showHistory() {
    historyModal.style.display = 'flex';
    historyListEl.innerHTML = '';
    
    const history = appState.currentUser.history || [];
    
    if (history.length === 0) {
        historyListEl.innerHTML = '<p>No quiz history yet.</p>';
        return;
    }
    
    history.slice().reverse().forEach((test, index) => {
        const testDate = new Date(test.date);
        const dateStr = testDate.toLocaleDateString();
        const timeStr = testDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const testItem = document.createElement('div');
        testItem.className = 'history-item';
        testItem.innerHTML = `
            <h3>Test ${history.length - index}</h3>
            <p>Score: <strong>${test.score}/100</strong></p>
            <p>Time: <strong>${test.timeTaken}s</strong></p>
            <p>Date: <strong>${dateStr} at ${timeStr}</strong></p>
            ${test.isTimeUp ? '<p>⏰ Time expired</p>' : ''}
        `;
        
        historyListEl.appendChild(testItem);
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);