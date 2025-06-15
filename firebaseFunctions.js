// !!! Zde vlož celý konfigurační objekt, který jsi zkopíroval z Firebase Console !!!

const firebaseConfig = {

    apiKey: "AIzaSyBCIHWbqCFJcCiuY-HFM3btTzUsByduluY",

    authDomain: "moje-vaha-beta-2.firebaseapp.com",

    projectId: "moje-vaha-beta-2",

    storageBucket: "moje-vaha-beta-2.firebasestorage.app",

    messagingSenderId: "870509063847",

    appId: "1:870509063847:web:6e0f922a1b8637e2713582"

    //measurementId: "G-D9FCW0YC2K" // Pokud nepoužíváš Analytics, může být zakomentováno

};



// Log pro potvrzení, že firebaseConfig byl načten

console.log("firebaseFunctions.js: Konfigurační objekt Firebase načten a připraven.", firebaseConfig.projectId);



// Inicializace Firebase aplikace

// Bude voláno až po načtení Firebase SDK

let db; // Proměnná pro instanci Firestore databáze



window.initializeFirebaseApp = function() {

    console.log("initializeFirebaseApp: Spuštěna inicializace Firebase aplikace.");

    // Kontrolujeme, zda je globální objekt firebase a jeho metody dostupné.

    // Metoda getApps() zkontroluje, zda už Firebase aplikace nebyla inicializována.

    if (typeof firebase === 'undefined' || typeof firebase.initializeApp === 'undefined') {

        console.error("initializeFirebaseApp: Firebase SDK není načteno. Nelze inicializovat.");

        return false;

    }



    if (!firebase.apps.length) {

        firebase.initializeApp(firebaseConfig);

        console.log("initializeFirebaseApp: Firebase aplikace inicializována.");

    } else {

        console.log("initializeFirebaseApp: Firebase aplikace již byla inicializována (přeskakuji).");

    }

    

    // Získáme instanci Firestore databáze

    db = firebase.firestore();

    console.log("initializeFirebaseApp: Firestore databáze připravena.");

    return true; // Signalizuje úspěšnou inicializaci

};





// --- FUNKCE PRO UKLÁDÁNÍ A NAČÍTÁNÍ VÁHOVÝCH ZÁZNAMŮ (weightLog) ---



// Funkce pro uložení dat weightLog do Firestore

// Data budou ukládána do kolekce 'weightEntries'

// Každý záznam bude dokumentem s ID rovným datumu záznamu (pro snadný upsert)

window.saveWeightLogToFirestore = async function(weightLogArray) {

    console.log("saveWeightLogToFirestore: Pokus o uložení dat weightLog do Firestore.", weightLogArray);

    if (!db) {

        console.error("saveWeightLogToFirestore: Firestore databáze není inicializována, nelze uložit data.");

        throw new Error("Firestore databáze není připravena k uložení dat.");

    }



    if (!weightLogArray || weightLogArray.length === 0) {

        console.warn("saveWeightLogToFirestore: Pole weightLog k uložení je prázdné. Přeskakuji ukládání.");

        // Volitelně můžete smazat kolekci, pokud je pole prázdné a chcete udržet db čistou

        // await window.clearAllFirestoreData(); 

        return; 

    }



    const batch = db.batch(); // Používáme batch pro efektivnější zápis více dokumentů

    console.log("saveWeightLogToFirestore: Vytvářím dávku pro zápis weightLog.");



    // Nejprve získáme všechny existující dokumenty v kolekci 'weightEntries'

    // a přidáme je do batch pro smazání, aby se předešlo duplicitám při plné synchronizaci.

    // POZOR: Toto maže všechny existující záznamy a nahrazuje je těmi z weightLogArray.

    // Pro reálnou aplikaci byste chtěli dělat chytřejší diff.

    const existingDocs = await db.collection('weightEntries').get();

    existingDocs.forEach(doc => {

        batch.delete(doc.ref);

    });

    console.log(`saveWeightLogToFirestore: Přidáno ${existingDocs.size} existujících dokumentů weightLog do dávky ke smazání.`);



    weightLogArray.forEach(entry => {

        const docRef = db.collection('weightEntries').doc(entry.date); // Datum jako ID dokumentu

        console.log(`saveWeightLogToFirestore: Přidávám dokument pro datum: ${entry.date} do dávky.`);

        batch.set(docRef, {

            date: entry.date,

            weight: entry.weight,

            bodyFat: entry.bodyFat,

            muscleMass: entry.muscleMass,

            bodyWater: entry.bodyWater,

            manualBMR: entry.manualBMR,

            manualAMR: entry.manualAMR,

            notes: entry.notes || '',

        });

    });



    try {

        console.log("saveWeightLogToFirestore: Odesílám dávku weightLog k zápisu.");

        await batch.commit(); // Odeslání všech zápisů

        console.log("saveWeightLogToFirestore: Data weightLog úspěšně uložena do Firestore.");

        return true;

    } catch (error) {

        console.error("saveWeightLogToFirestore: Chyba při ukládání dat weightLog do Firestore:", error);

        throw error;

    }

};



// Funkce pro načtení dat weightLog z Firestore

window.loadWeightLogFromFirestore = async function() {

    console.log("loadWeightLogFromFirestore: Pokus o načtení dat weightLog z Firestore.");

    if (!db) {

        console.error("loadWeightLogFromFirestore: Firestore databáze není inicializována, nelze načíst data.");

        return []; // Vrať prázdné pole, pokud databáze není připravena

    }



    try {

        console.log("loadWeightLogFromFirestore: Načítám snímek kolekce 'weightEntries'.");

        const snapshot = await db.collection('weightEntries').orderBy('date').get();

        const loadedData = [];

        console.log("loadWeightLogFromFirestore: Snímek načten, zpracovávám dokumenty weightLog.");

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

            console.log(`loadWeightLogFromFirestore: Přidán weightLog dokument: ${doc.id}`);

        });

        console.log("loadWeightLogFromFirestore: Data weightLog úspěšně načtena z Firestore:", loadedData);

        return loadedData;

    } catch (error) {

        console.error("loadWeightLogFromFirestore: Chyba při načítání dat weightLog z Firestore:", error);

        throw error;

    }

};



// Funkce pro smazání jednotlivého záznamu weightLog z Firestore

window.deleteWeightEntryFromFirestore = async function(date) {

    console.log(`deleteWeightEntryFromFirestore: Pokus o smazání záznamu pro datum: ${date} z kolekce 'weightEntries'.`);

    if (!db) {

        console.error("deleteWeightEntryFromFirestore: Firestore databáze není inicializována, nelze smazat data.");

        throw new Error("Firestore databáze není připravena ke smazání dat.");

    }

    try {

        console.log(`deleteWeightEntryFromFirestore: Mažu dokument s ID: ${date} z 'weightEntries'.`);

        await db.collection('weightEntries').doc(date).delete();

        console.log(`deleteWeightEntryFromFirestore: Záznam pro datum ${date} úspěšně smazán z Firestore.`);

        return true;

    } catch (error) {

        console.error(`deleteWeightEntryFromFirestore: Chyba při mazání záznamu pro datum ${date} z Firestore:`, error);

        throw error;

    }

};



// --- NOVÉ FUNKCE PRO UKLÁDÁNÍ A NAČÍTÁNÍ NASTAVENÍ (settings) ---



// Funkce pro uložení settings do Firestore

window.saveSettingsToFirestore = async function(settingsObject) {

    console.log("saveSettingsToFirestore: Pokus o uložení nastavení do Firestore.", settingsObject);

    if (!db) {

        console.error("saveSettingsToFirestore: Firestore databáze není inicializována, nelze uložit nastavení.");

        throw new Error("Firestore databáze není připravena k uložení nastavení.");

    }

    try {

        // Uložíme settings jako jeden dokument v kolekci 'userSettings'

        // Použijeme pevné ID dokumentu, např. 'mainSettings'

        const docRef = db.collection('userSettings').doc('mainSettings');

        console.log("saveSettingsToFirestore: Ukládám dokument 'mainSettings' do kolekce 'userSettings'.");

        await docRef.set(settingsObject, { merge: true }); // merge: true sloučí nová data s existujícími

        console.log("saveSettingsToFirestore: Nastavení úspěšně uložena do Firestore.");

        return true;

    } catch (error) {

        console.error("saveSettingsToFirestore: Chyba při ukládání nastavení do Firestore:", error);

        throw error;

    }

};



// Funkce pro načtení settings z Firestore

window.loadSettingsFromFirestore = async function() {

    console.log("loadSettingsFromFirestore: Pokus o načtení nastavení z Firestore.");

    if (!db) {

        console.error("loadSettingsFromFirestore: Firestore databáze není inicializována, nelze načíst nastavení.");

        return null; // Vrať null, pokud databáze není připravena

    }

    try {

        const docRef = db.collection('userSettings').doc('mainSettings');

        console.log("loadSettingsFromFirestore: Načítám dokument 'mainSettings' z kolekce 'userSettings'.");

        const doc = await docRef.get();

        if (doc.exists) {

            console.log("loadSettingsFromFirestore: Nastavení úspěšně načtena z Firestore.", doc.data());

            return doc.data();

        } else {

            console.log("loadSettingsFromFirestore: Dokument s nastavením 'mainSettings' neexistuje.");

            return null;

        }

    } catch (error) {

        console.error("loadSettingsFromFirestore: Chyba při načítání nastavení z Firestore:", error);

        throw error;

    }

};



// --- NOVÉ FUNKCE PRO UKLÁDÁNÍ A NAČÍTÁNÍ CÍLŮ (goals) ---



// Funkce pro uložení goals do Firestore

window.saveGoalsToFirestore = async function(goalsObject) {

    console.log("saveGoalsToFirestore: Pokus o uložení cílů do Firestore.", goalsObject);

    if (!db) {

        console.error("saveGoalsToFirestore: Firestore databáze není inicializována, nelze uložit cíle.");

        throw new Error("Firestore databáze není připravena k uložení cílů.");

    }

    try {

        // Uložíme goals jako jeden dokument v kolekci 'userGoals'

        // Použijeme pevné ID dokumentu, např. 'mainGoals'

        const docRef = db.collection('userGoals').doc('mainGoals');

        console.log("saveGoalsToFirestore: Ukládám dokument 'mainGoals' do kolekce 'userGoals'.");

        await docRef.set(goalsObject, { merge: true });

        console.log("saveGoalsToFirestore: Cíle úspěšně uloženy do Firestore.");

        return true;

    } catch (error) {

        console.error("saveGoalsToFirestore: Chyba při ukládání cílů do Firestore:", error);

        throw error;

    }

};



// Funkce pro načtení goals z Firestore

window.loadGoalsFromFirestore = async function() {

    console.log("loadGoalsFromFirestore: Pokus o načtení cílů z Firestore.");

    if (!db) {

        console.error("loadGoalsFromFirestore: Firestore databáze není inicializována, nelze načíst cíle.");

        return null; // Vrať null, pokud databáze není připravena

    }

    try {

        const docRef = db.collection('userGoals').doc('mainGoals');

        console.log("loadGoalsFromFirestore: Načítám dokument 'mainGoals' z kolekce 'userGoals'.");

        const doc = await docRef.get();

        if (doc.exists) {

            console.log("loadGoalsFromFirestore: Cíle úspěšně načteny z Firestore.", doc.data());

            return doc.data();

        } else {

            console.log("loadGoalsFromFirestore: Dokument s cíli 'mainGoals' neexistuje.");

            return null;

        }

    } catch (error) {

        console.error("loadGoalsFromFirestore: Chyba při načítání cílů z Firestore:", error);

        throw error;

    }

};



// Funkce pro smazání všech dat z kolekce Firestore (POZOR! Důrazně! Záměrné mazání všech dat!)

// Rozšířena o mazání settings a goals kolekcí

window.clearAllFirestoreData = async function() {

    console.log("clearAllFirestoreData: Pokus o smazání všech dat z Firebase Firestore (všechny určené kolekce).");

    if (!db) {

        console.error("clearAllFirestoreData: Firestore databáze není inicializována, nelze smazat všechna data.");

        throw new Error("Firestore databáze není připravena ke smazání všech dat.");

    }



    try {

        // Seznam kolekcí, které chceme smazat

        const collectionsToClear = ['weightEntries', 'userSettings', 'userGoals'];

        let totalDeletedCount = 0;



        for (const collectionName of collectionsToClear) {

            console.log(`clearAllFirestoreData: Spouštím mazání dokumentů z kolekce '${collectionName}'.`);

            const collectionRef = db.collection(collectionName);

            const snapshot = await collectionRef.get();

            const batch = db.batch();

            let deletedInCollection = 0;



            if (snapshot.size === 0) {

                console.log(`clearAllFirestoreData: Kolekce '${collectionName}' je již prázdná.`);

                continue; // Přeskočit, pokud v kolekci nejsou žádné dokumenty

            }



            snapshot.docs.forEach(doc => {

                batch.delete(doc.ref);

                deletedInCollection++;

            });



            console.log(`clearAllFirestoreData: Přidáno ${deletedInCollection} dokumentů z kolekce '${collectionName}' do dávky pro smazání.`);

            await batch.commit();

            console.log(`clearAllFirestoreData: Smazáno ${deletedInCollection} dokumentů z kolekce '${collectionName}'.`);

            totalDeletedCount += deletedInCollection;

        }

        

        console.log(`clearAllFirestoreData: Všechna data z určených kolekcí Firestore úspěšně smazána. Celkem smazáno: ${totalDeletedCount} dokumentů.`);

        return true;

    } catch (error) {

        console.error("clearAllFirestoreData: Chyba při mazání všech dat z Firestore:", error);

        throw error;

    }

};
