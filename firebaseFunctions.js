// firebaseFunctions.js
// Tento soubor obsahuje logiku pro Firebase Firestore s pokročilým logováním.

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

// Pomocné funkce pro barevné logování
const logSuccess = (message, data = null) => {
    console.log(`%c✅ SUCCESS: ${message}`, 'color: #22c55e; font-weight: bold;');
    if (data) console.log('%cData:', 'color: #22c55e;', data);
};

const logError = (message, error = null) => {
    console.log(`%c❌ ERROR: ${message}`, 'color: #ef4444; font-weight: bold;');
    if (error) console.error('%cError details:', 'color: #ef4444;', error);
};

const logInfo = (message, data = null) => {
    console.log(`%c🔵 INFO: ${message}`, 'color: #3b82f6; font-weight: bold;');
    if (data) console.log('%cData:', 'color: #3b82f6;', data);
};

const logWarning = (message, data = null) => {
    console.log(`%c⚠️ WARNING: ${message}`, 'color: #f59e0b; font-weight: bold;');
    if (data) console.log('%cData:', 'color: #f59e0b;', data);
};

const logProcess = (message) => {
    console.log(`%c🔄 PROCESSING: ${message}`, 'color: #8b5cf6; font-weight: bold;');
};

window.initializeFirebaseApp = function() {
    logProcess('Zahajuji inicializaci Firebase aplikace...');
    
    try {
        // Kontrola dostupnosti Firebase SDK
        if (typeof firebase === 'undefined') {
            logError('Firebase SDK není načteno!');
            return false;
        }
        logSuccess('Firebase SDK úspěšně načteno');

        // Kontrolujeme, zda je globální objekt firebase a jeho metody dostupné.
        // Metoda getApps() zkontroluje, zda už Firebase aplikace nebyla inicializována.
        if (!firebase.apps.length) {
            logProcess('Inicializuji novou Firebase aplikace...');
            firebase.initializeApp(firebaseConfig);
            logSuccess('Firebase aplikace úspěšně inicializována', {
                projectId: firebaseConfig.projectId,
                authDomain: firebaseConfig.authDomain
            });
        } else {
            logWarning('Firebase aplikace již byla dříve inicializována');
        }
        
        // Získáme instanci Firestore databáze
        logProcess('Připojuji se k Firestore databázi...');
        db = firebase.firestore();
        
        if (db) {
            logSuccess('Firestore databáze úspěšně připojena a připravena k použití');
            logInfo('Databáze je připravena pro operace', {
                type: 'Firestore',
                project: firebaseConfig.projectId
            });
            return true;
        } else {
            logError('Nepodařilo se získat instanci Firestore databáze');
            return false;
        }
        
    } catch (error) {
        logError('Kritická chyba při inicializaci Firebase', error);
        return false;
    }
};

// Funkce pro uložení dat do Firestore
window.saveWeightLogToFirestore = async function(weightLogArray) {
    logProcess(`Zahajuji ukládání ${weightLogArray.length} záznamů do Firestore...`);
    
    if (!db) {
        logError('Firestore databáze není inicializována, nelze uložit data');
        throw new Error("Firestore databáze není připravena k uložení dat.");
    }
    logSuccess('Firestore databáze je připravena pro zápis');

    try {
        logProcess('Vytvářím batch operaci pro efektivní zápis...');
        const batch = db.batch(); // Používáme batch pro efektivnější zápis více dokumentů
        let processedCount = 0;

        weightLogArray.forEach((entry, index) => {
            logInfo(`Zpracovávám záznam ${index + 1}/${weightLogArray.length}`, {
                date: entry.date,
                weight: entry.weight
            });
            
            // Používáme datum jako ID dokumentu pro jednoduchý upsert (aktualizace/vložení)
            const docRef = db.collection('weightEntries').doc(entry.date); 
            
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
            
            processedCount++;
        });

        logSuccess(`Všech ${processedCount} záznamů připraveno pro zápis`);
        logProcess('Odesílám batch operaci do Firestore...');
        
        await batch.commit(); // Odeslání všech zápisů
        
        logSuccess(`Data úspěšně uložena do Firestore! Uloženo ${processedCount} záznamů`, {
            collection: 'weightEntries',
            recordsCount: processedCount
        });
        return true;
        
    } catch (error) {
        logError('Kritická chyba při ukládání dat do Firestore', error);
        throw error;
    }
};

// Funkce pro načtení dat z Firestore
window.loadWeightLogFromFirestore = async function() {
    logProcess('Zahajuji načítání dat z Firestore...');
    
    if (!db) {
        logError('Firestore databáze není inicializována, nelze načíst data');
        return []; // Vrať prázdné pole, pokud databáze není připravena
    }
    logSuccess('Firestore databáze je připravena pro čtení');

    try {
        logProcess('Odesílám dotaz do Firestore kolekce "weightEntries"...');
        const snapshot = await db.collection('weightEntries').orderBy('date').get();
        
        if (snapshot.empty) {
            logWarning('Kolekce je prázdná - nebyla nalezena žádná data');
            return [];
        }
        
        logInfo(`Nalezeno ${snapshot.size} dokumentů v kolekci`);
        
        const loadedData = [];
        let processedDocs = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const record = {
                date: data.date,
                weight: data.weight,
                bodyFat: data.bodyFat || null,
                muscleMass: data.muscleMass || null,
                bodyWater: data.bodyWater || null,
                manualBMR: data.manualBMR || null,
                manualAMR: data.manualAMR || null,
                notes: data.notes || ''
            };
            
            loadedData.push(record);
            processedDocs++;
            
            logInfo(`Zpracován dokument ${processedDocs}/${snapshot.size}`, {
                id: doc.id,
                date: data.date,
                weight: data.weight
            });
        });
        
        logSuccess(`Data úspěšně načtena z Firestore! Načteno ${loadedData.length} záznamů`, {
            collection: 'weightEntries',
            recordsCount: loadedData.length,
            dateRange: loadedData.length > 0 ? {
                from: loadedData[0].date,
                to: loadedData[loadedData.length - 1].date
            } : null
        });
        
        return loadedData;
        
    } catch (error) {
        logError('Kritická chyba při načítání dat z Firestore', error);
        throw error;
    }
};

// Funkce pro smazání záznamu z Firestore
window.deleteWeightEntryFromFirestore = async function(date) {
    logProcess(`Zahajuji mazání záznamu pro datum: ${date}`);
    
    if (!db) {
        logError('Firestore databáze není inicializována, nelze smazat data');
        throw new Error("Firestore databáze není připravena ke smazání dat.");
    }
    logSuccess('Firestore databáze je připravena pro mazání');
    
    try {
        logProcess(`Odesílám požadavek na smazání dokumentu s ID: ${date}`);
        await db.collection('weightEntries').doc(date).delete();
        
        logSuccess(`Záznam pro datum ${date} úspěšně smazán z Firestore`, {
            collection: 'weightEntries',
            deletedDocument: date
        });
        return true;
        
    } catch (error) {
        logError(`Kritická chyba při mazání záznamu pro datum ${date} z Firestore`, error);
        throw error;
    }
};

// Funkce pro smazání všech dat z kolekce Firestore (POZOR! Důrazně! Záměrné mazání všech dat!)
window.clearAllFirestoreData = async function() {
    logWarning('⚠️ POZOR! Zahajuji mazání VŠECH dat z Firestore!');
    
    if (!db) {
        logError('Firestore databáze není inicializována, nelze smazat všechna data');
        throw new Error("Firestore databáze není připravena ke smazání všech dat.");
    }
    logSuccess('Firestore databáze je připravena pro hromadné mazání');

    try {
        logProcess('Načítám všechny dokumenty z kolekce "weightEntries"...');
        const collectionRef = db.collection('weightEntries');
        const snapshot = await collectionRef.get();
        
        if (snapshot.empty) {
            logWarning('Kolekce je již prázdná - není co mazat');
            return true;
        }
        
        logInfo(`Nalezeno ${snapshot.size} dokumentů k smazání`);
        logProcess('Vytvářím batch operaci pro hromadné mazání...');
        
        const batch = db.batch();
        let docsToDelete = 0;

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            docsToDelete++;
            logInfo(`Přidán dokument do batch mazání: ${doc.id}`);
        });

        logProcess(`Odesílám batch operaci pro smazání ${docsToDelete} dokumentů...`);
        await batch.commit();
        
        logSuccess(`Všechna data z Firestore kolekce 'weightEntries' úspěšně smazána!`, {
            collection: 'weightEntries',
            deletedDocuments: docsToDelete
        });
        return true;
        
    } catch (error) {
        logError('Kritická chyba při mazání všech dat z Firestore', error);
        throw error;
    }
};
