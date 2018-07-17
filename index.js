const admin = require('firebase-admin');
const serviceAccount = require('./my-brand-new-firebase-key.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const rawData = require('./cards.collectible.json');

function getTransformedCards() {
    const transformedCards = [];

    for (const rawCard of rawData) {
        transformedCards.push({
            id: rawCard.id,
            name: rawCard.name,
            rarity: rawCard.rarity,
            factionId: rawCard.cardClass,
            cost: rawCard.cost || null,
            types: [rawCard.type],
            subtypes: rawCard.race ? [rawCard.race] : [],
            text: rawCard.text || null,
            // some fields are stored in a "printing" since some games print cards
            // multiple times (like Magic) with different flavor/artists
            printings: [{
                artist: rawCard.artist || null,
                flavorText: rawCard.flavor || null,
                // see https://hearthstonejson.com/docs/images.html
                image: `https://art.hearthstonejson.com/v1/512x/${rawCard.id}.webp`,
                printedIn: rawCard.set
            }]
        });
    }

    console.log(`Transformed ${transformedCards.length} cards. One of them looks like this!`);
    console.log(transformedCards[0]);
    return transformedCards;
}

async function addTransformedCardsToFirebase(transformedCards) {
    for (const card of transformedCards) {
        await db
            .collection('cards')
            .doc(card.id)
            .set(card);
    }
}

(async () => {
    console.log("Let's import some Hearthstone data!");
    const transformedCards = getTransformedCards();
    console.log("Transformed the data...");
    await addTransformedCardsToFirebase(transformedCards);
    console.log("Added data to Firebase. All done!");
})();