import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
} from "firebase/auth";
import { FIREBASE_APP, FIREBASE_AUTH } from "./FirebaseConfig";
import {
    addDoc,
    collection,
    getDoc,
    doc,
    updateDoc,
    query,
    where,
    getDocs,
    getFirestore,
    onSnapshot,
    setDoc,
    Timestamp,
    serverTimestamp,
    arrayUnion,
    deleteDoc,
} from "firebase/firestore";
import { Alert } from "react-native";

const auth = FIREBASE_AUTH;
const db = getFirestore(FIREBASE_APP);

export const getLecturers = async (
    searchText = "",
    faculty = "",
    userType = ""
) => {
    let q = collection(db, "lecturers");

    const conditions = [];
    if (faculty) conditions.push(where("faculty", "==", faculty));
    if (userType) conditions.push(where("userType", "==", userType));

    if (conditions.length > 0) {
        q = query(collection(db, "lecturers"), ...conditions);
    }

    const snapshot = await getDocs(q);

    const lecturers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

    return searchText
        ? lecturers.filter((lecturer) =>
            lecturer.name.toLowerCase().includes(searchText.toLowerCase())
        )
        : lecturers;
};

export const getLecturer = async (id) => {
    try {
        const docRef = doc(db, "lecturers", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.warn("No matching Mentor found");
            return null;
        }
    } catch (error) {
        console.error("Error fetching mentor:", error);
        return null;
    }
};

export const getEvent = async (id) => {
    try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.warn("No matching Mentor found");
            return null;
        }
    } catch (error) {
        console.error("Error fetching mentor:", error);
        return null;
    }
};

export const registerParticipant = async (eventId, studentId) => {
    const q = query(
        collection(db, "event_participants"),
        where("event_id", "==", eventId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;

        await updateDoc(docRef, {
            participants: arrayUnion({
                student_id: studentId,
                joined_date: new Date(),
            }),
        });
    } else {
        const docRef = doc(collection(db, "event_participants"));
        await setDoc(docRef, {
            event_id: eventId,
            participants: [
                {
                    student_id: studentId,
                    joined_date: new Date(),
                },
            ],
        });
    }
};

export const unregisterParticipant = async (eventId, studentId) => {
    const participantDocRef = doc(db, "event_participants", eventId, "participants", studentId);
    await deleteDoc(participantDocRef);
};

// export const getEvents = async () => {
//   const querySnapshot = await getDocs(collection(db, "events"));
//   return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
// };