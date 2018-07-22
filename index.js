const admin = require('firebase-admin');
const serviceAccount = require('./my-brand-new-firebase-key.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const rawData = require('./cards.collectible.json');
const algolia = require('algoliasearch');

const setNames = {
    "BRM": "Blackrock Mountain",
    "CORE": "Basic and Free Cards",
    "EXPERT1": "Classic",
    "HERO_SKINS": "Heroes",
    "LOE": "The League of Explorers",
    "OG": "Whispers of the Old Gods",
    "GANGS": "The Mean Streets of Gadgetzan",
    "GILNEAS": "The Witchwood",
    "GVG": "Goblins vs. Gnomes",
    "HOF": "Hall of Fame",
    "ICECROWN": "The Frozen Throne",
    "LOOTAPALOOZA": "Kobolds & Catacombs",
    "KARA": "One Night in Karazhan",
    "NAXX": "Curse of Naxxramas",
    "PROMO": "Promotional",
    "REWARD": "Reward",
    "TGT": "The Grand Tournament",
    "UNGORO": "Journey to Un'Goro",
}

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
            thumbnail: `https://art.hearthstonejson.com/v1/256x/${rawCard.id}.webp`,
            printings: [{
                artist: rawCard.artist || null,
                flavorText: rawCard.flavor || null,
                image: `https://art.hearthstonejson.com/v1/render/latest/enUS/256x/${rawCard.id}.png`,
                printedIn: setNames[rawCard.set] || rawCard.set
            }]
        });

        if (!setNames[rawCard.set]) {
            console.log(`WHUH OH: Set ${rawCard.set} is new and not in the list of sets. Check it!`);
        }
    }

    console.log(`Transformed ${transformedCards.length} cards`);
    return transformedCards;
}

async function addTransformedCardsToFirebase(transformedCards) {
    console.log('Adding cards to Firebase...');
    for (const card of transformedCards) {
        await db
            .collection('cards')
            .doc(card.id)
            .set(card);
    }

    console.log("Added cards to Firebase.");
}

function createSearchIndex(cards) {
    const algoliaClient = algolia(process.env.ALGOLIA_APPID, process.env.ALGOLIA_APIKEY);
    const indexName = "cards";
    for (const card of cards) {
        card.objectID = card.id;
    }

    algoliaClient.deleteIndex(indexName, (err, result) => {
        const index = algoliaClient.initIndex(indexName);
        index.saveObjects(cards);
    });
}

(async () => {
    console.log("Let's import some Hearthstone data!");
    const transformedCards = getTransformedCards();
    // await addTransformedCardsToFirebase(transformedCards);
    createSearchIndex(transformedCards);
    console.log("All done!");
})();