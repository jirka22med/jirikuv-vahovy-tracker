// firebaseFunctions.js
// Tento soubor obsahuje logiku pro Firebase Firestore.

// !!! Zde vlož celý konfigurační objekt, který jsi zkopíroval z Firebase Console !!!
const firebaseConfig = {
  apiKey: "AIzaSyBCIHWbqCFJcCiuY-HFM3btTzUsByduluY",
  authDomain: "moje-vaha-beta-2.firebaseapp.com",
  projectId: "moje-vaha-beta-2",
  storageBucket: "moje-vaha-beta-2.firebasestorage.app",
  messagingSenderId: "870509063847",
  appId: "1:870509063847:web:6e0f922a1b8637e2713582"
  //measurementId: "G-D9FCW0YC2K"
};

// Inicializace Firebase aplikace
// Bude voláno až po načtení Firebase SDK
let db; // Proměnná pro instanci Firestore databáze

window.initializeFirebaseApp = function() {
    // Kontrolujeme, zda je globální objekt firebase a jeho metody dostupné.
    // Metoda getApps() zkontroluje, zda už Firebase aplikace nebyla inicializována.
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase aplikace inicializována.");
    } else {
        console.log("Firebase aplikace již byla inicializována.");
    }
    
    // Získáme instanci Firestore databáze
    db = firebase.firestore();
    console.log("Firestore databáze připravena.");
    return true; // Signalizuje úspěšnou inicializaci
};


// Funkce pro uložení dat do Firestore
// Data budou ukládána do kolekce 'weightEntries'
// Každý záznam bude dokumentem s ID rovným datumu záznamu (pro snadný upsert)
window.saveWeightLogToFirestore = async function(weightLogArray) {
    if (!db) {
        console.error("Firestore databáze není inicializována, nelze uložit data.");
        throw new Error("Firestore databáze není připravena k uložení dat.");
    }

    const batch = db.batch(); // Používáme batch pro efektivnější zápis více dokumentů

    weightLogArray.forEach(entry => {
        // Používáme datum jako ID dokumentu pro jednoduchý upsert (aktualizace/vložení)
        const docRef = db.collection('weightEntries').doc(entry.date); 
        // Ukládáme data tak, jak jsou v objektu, ale Firestore automaticky mapuje
        // camelCase (bodyFat) na snake_case (body_fat) není potřeba měnit.
        // Důležité je, aby typy v Firestore odpovídaly (number, string, boolean, timestamp/date).
        batch.set(docRef, {
            date: entry.date, // Může být string 'YYYY-MM-DD'
            weight: entry.weight,
            bodyFat: entry.bodyFat,
            muscleMass: entry.muscleMass,
            bodyWater: entry.bodyWater,
            manualBMR: entry.manualBMR,
            manualAMR: entry.manualAMR,
            notes: entry.notes || '',
            // Firestore automaticky přidá timestamp pro created_at/updated_at
            // Lze také přidat ServerTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            // pro přesné časové razítko z Firebase serveru.
        });
    });

    try {
        await batch.commit(); // Odeslání všech zápisů
        console.log("Data úspěšně uložena do Firestore.");
        return true;
    } catch (error) {
        console.error("Chyba při ukládání dat do Firestore:", error);
        throw error;
    }
};

// Funkce pro načtení dat z Firestore
window.loadWeightLogFromFirestore = async function() {
    if (!db) {
        console.error("Firestore databáze není inicializována, nelze načíst data.");
        return []; // Vrať prázdné pole, pokud databáze není připravena
    }

    try {
        const snapshot = await db.collection('weightEntries').orderBy('date').get();
        const loadedData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            loadedData.push({
                date: data.date,
                weight: data.weight,
                bodyFat: data.bodyFat || null,
                muscleMass: data.muscleMass || null,
                bodyWater: data.bodyWater || null,
                manualBMR: data.manualBMR || null,
                manualAMR: data.manualAMR || null,
                notes: data.notes || ''
            });
        });
        console.log("Data úspěšně načtena z Firestore:", loadedData);
        return loadedData;
    } catch (error) {
        console.error("Chyba při načítání dat z Firestore:", error);
        throw error;
    }
};

// Funkce pro smazání záznamu z Firestore
window.deleteWeightEntryFromFirestore = async function(date) {
    if (!db) {
        console.error("Firestore databáze není inicializována, nelze smazat data.");
        throw new Error("Firestore databáze není připravena ke smazání dat.");
    }
    try {
        await db.collection('weightEntries').doc(date).delete();
        console.log(`Záznam pro datum ${date} úspěšně smazán z Firestore.`);
        return true;
    } catch (error) {
        console.error(`Chyba při mazání záznamu pro datum ${date} z Firestore:`, error);
        throw error;
    }
};

// Funkce pro smazání všech dat z kolekce Firestore (POZOR! Důrazně! Záměrné mazání všech dat!)
window.clearAllFirestoreData = async function() {
    if (!db) {
        console.error("Firestore databáze není inicializována, nelze smazat všechna data.");
        throw new Error("Firestore databáze není připravena ke smazání všech dat.");
    }

    try {
        const collectionRef = db.collection('weightEntries');
        const snapshot = await collectionRef.get();
        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log("Všechna data z Firestore kolekce 'weightEntries' smazána.");
        return true;
    } catch (error) {
        console.error("Chyba při mazání všech dat z Firestore:", error);
        throw error;
    }
};
