const math = require('mathjs');
const crypto = require('crypto');

const margin = 1.10; // 10% margin

function normalizeProbabilities(probabilities) {
    const total = probabilities.reduce((sum, p) => sum + p, 0);
    return probabilities.map(p => p / total);
}

function calculateOdds(probabilities) {
    return probabilities.map(p => (1 / p) - 1);
}

function applyMargin(probabilities, margin) {
    const totalProbability = probabilities.reduce((sum, p) => sum + p, 0);
    const scale = margin / totalProbability;
    return probabilities.map(p => p * scale);
}

function calculateOddsWithMargins(probabilities, margin) {
    const adjustedProbabilities = applyMargin(probabilities, margin);
    return calculateOdds(adjustedProbabilities);
}

function generateForecastOdds(winProbabilities) {
    const forecastOdds = {};
    const numGreyhounds = winProbabilities.length;
    for (let i = 0; i < numGreyhounds; i++) {
        for (let j = 0; j < numGreyhounds; j++) {
            if (i !== j) {
                const forecastProb = winProbabilities[i] * winProbabilities[j] / (1 - winProbabilities[i]);
                forecastOdds[`${i},${j}`] = (1 / forecastProb) - 1;
            }
        }
    }
    return forecastOdds;
}

function generateTricastOdds(winProbabilities) {
    const tricastOdds = {};
    const numGreyhounds = winProbabilities.length;
    for (let i = 0; i < numGreyhounds; i++) {
        for (let j = 0; j < numGreyhounds; j++) {
            for (let k = 0; k < numGreyhounds; k++) {
                if (i !== j && j !== k && i !== k) {
                    const tricastProb = (winProbabilities[i] * winProbabilities[j] * winProbabilities[k]) /
                        ((1 - winProbabilities[i]) * (1 - winProbabilities[j]));
                    tricastOdds[`${i},${j},${k}`] = (1 / tricastProb) - 1;
                }
            }
        }
    }
    return tricastOdds;
}

function weightedRandomChoice(weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = crypto.randomInt(0, 100000) / 100000 * totalWeight;
    let cumulativeWeight = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulativeWeight += weights[i];
        if (random < cumulativeWeight) {
            return i;
        }
    }
}

function determineWinner(winProbabilities) {
    return weightedRandomChoice(winProbabilities);
}

function determineForecast(winProbabilities, winner) {
    const remainingProbabilities = winProbabilities.slice();
    remainingProbabilities.splice(winner, 1);
    const remainingGreyhounds = Array.from({ length: winProbabilities.length }, (_, i) => i).filter(i => i !== winner);
    const secondPlace = weightedRandomChoice(remainingProbabilities);
    return { winner, secondPlace: remainingGreyhounds[secondPlace] };
}

function determineTricast(winProbabilities, winner, secondPlace) {
    const remainingProbabilities = winProbabilities.slice();
    remainingProbabilities.splice(Math.max(winner, secondPlace), 1);
    remainingProbabilities.splice(Math.min(winner, secondPlace), 1);
    const remainingGreyhounds = Array.from({ length: winProbabilities.length }, (_, i) => i).filter(i => i !== winner && i !== secondPlace);
    const thirdPlace = weightedRandomChoice(remainingProbabilities);
    return { winner, secondPlace, thirdPlace: remainingGreyhounds[thirdPlace] };
}

const numGreyhounds = 6;

const winProbabilities = normalizeProbabilities(Array.from({ length: numGreyhounds }, () => crypto.randomInt(0, 100000) / 100000));
const winOdds = calculateOddsWithMargins(winProbabilities, margin);


const forecastOdds = generateForecastOdds(winProbabilities);
const tricastOdds = generateTricastOdds(winProbabilities);

const winner = determineWinner(winProbabilities);
const { secondPlace } = determineForecast(winProbabilities, winner);
const { thirdPlace } = determineTricast(winProbabilities, winner, secondPlace);


console.log("Win Odds:");
winOdds.forEach((odds, i) => {
    console.log(`Greyhound ${i + 1}: ${odds.toFixed(2)}`);
});

console.log("\nForecast Odds:");
for (const [key, odds] of Object.entries(forecastOdds)) {
    const [i, j] = key.split(',').map(Number);
    console.log(`Greyhound ${i + 1} -> Greyhound ${j + 1}: ${odds.toFixed(2)}`);
}

console.log("\nTricast Odds:");
for (const [key, odds] of Object.entries(tricastOdds)) {
    const [i, j, k] = key.split(',').map(Number);
    console.log(`Greyhound ${i + 1} -> Greyhound ${j + 1} -> Greyhound ${k + 1}: ${odds.toFixed(2)}`);
}

console.log("\nRace Results:");
console.log(`Winner: Greyhound ${winner + 1}`);
console.log(`Second: Greyhound ${secondPlace + 1}`);
console.log(`Third: Greyhound ${thirdPlace + 1}`);