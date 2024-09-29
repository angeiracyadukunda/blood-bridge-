const { signInWithEmailAndPassword } = require('firebase/auth');
const fbConfig = '../firebase/firebaseConfig';
const { authentication } = require(fbConfig);
const { auth, db } = require('../firebase/firebaseAdmin');


const loginUser = async (req, res) => {
    const { username, password, keepSignedIn } = req.body;

    try {
        const userCredential = await signInWithEmailAndPassword(authentication, username, password);
        const user = userCredential.user;

        // Fetch user document from Firestore to check email verification status
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        //Check if the document exists and if the email is verified
        if (userDoc.exists){
            if(!userDoc.data().emailVerified) {
                return res.status(403).json({ message: 'Email not verified. Please verify your email before signing in.' });
            }
        } else{
            res.status(403).json({ message: 'Invalid login credentials' });
        }
        
        if (keepSignedIn) {
            req.session.cookie.maxAge = 90 * 24 * 60 * 60 * 1000; // 3 months in milliseconds
        } else {
            req.session.cookie.expires = false; // Session ends when the browser is closed
        }

        req.session.user = {
            uid: user.uid,
            email: user.email,
        };
        res.status(200).json({ message: 'Login successful. Welcome!' });
    } catch (error) {
        res.status(401).json({ message: 'Invalid login credentials' });
    }
};

const checkUserSession = (req, res) => {
    if (req.session.user) {
        return res.status(200).json({ loggedIn: true, user: req.session.user });
    }
    return res.status(401).json({ loggedIn: false });
};

// Logout Controller
const logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: 'Logged out successfully' });
    });
};

module.exports = { loginUser, checkUserSession, logoutUser };
