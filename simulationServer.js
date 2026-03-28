const express = require('express') 
const cors = require('cors') 

const exp = express() 
exp.use(cors()) 
exp.use(express.json()) 

exp.use(express.static("./webApplication")) 

const Sim = require('pokemon-showdown') 
const {Teams, Dex} = require('pokemon-showdown') 
const fs = require('fs') 
const setDir = "./pokemonSets/"

exp.post("/sim/1v1", function (request, result) {
    const stream = new Sim.BattleStream()
    readStream(stream, result);

    stream.write(`>start {"formatid":"custombattle"}`)

    try {
        addPlayers(stream, ["left", "right"], [[setDir + request["body"]["left"] + ".txt"], [setDir + request["body"]["right"] + ".txt"]])
    } catch {
        console.log("1v1: Player initialization failed")
        stream._destroy()
        return
    }

    stream.write(">p1 team 1")
    stream.write(">p2 team 1")

    for (let i = 0;  i < 200;  i++) {
        moveChoiceSingles(stream, 1, stream.battle.sides[0].active[0])
        moveChoiceSingles(stream, 2, stream.battle.sides[1].active[0])
    }
})

exp.post("/sim/2v2", function (request, result) {
    const stream = new Sim.BattleStream()
    readStream(stream, result);

    stream.write(`>start {"formatid":"[Gen 9] Doubles Custom Game"}`)

    try {
        addPlayers(stream, ["left", "right"], [pathsTo(request["body"]["left"]), pathsTo(request["body"]["right"])])
    } catch {
        console.log("2v2: Player initialization failed")
        stream._destroy()
        return
    }

    let lead = Math.floor(Math.random() * 2) + 1
    stream.write(`>p1 team ${lead}${lead % 2 + 1}`)
    lead = Math.floor(Math.random() * 2) + 1
    stream.write(`>p2 team ${lead}${lead % 2 + 1}`)

    for (let i = 0;  i < 200;  i++) {
        playerMoveChoicesDoubles(stream, 1, stream.battle.sides[0])
        playerMoveChoicesDoubles(stream, 2, stream.battle.sides[1])
    }
})

async function readStream(stream, resultVariable) {
    for await (const output of stream) {
        console.log(output)
    }
    resultVariable.send(stream.battle)
}

function addPlayers(stream, names, sources) {
    let i = 1
    for (let name of names) {
        addPlayer(stream, i, name, sources[i - 1])
        i += 1
    }
}

function addPlayer(stream, number, name, sources) {
    const sets = readSets(sources)
    if (sets.length > 0) {
        stream.write(`>player p${number} ${JSON.stringify({"name": name, "team": Teams.pack(Teams.import(mergeSets(sets)))})}`)
    }
}

function moveChoiceSingles(stream, playerNumber, pokemonStatus) {
    const choice = getMoveChoice(pokemonStatus)
    if (typeof(pokemonStatus.canMegaEvo) == 'string' && Math.random() < 0.5) {
        stream.write(`>p${playerNumber} move ${choice} mega`)
    }
    else if (Math.random() < 0.5 && Dex.moves.get(pokemonStatus.moveSlots[choice - 1].move).type == zCristalType[pokemonStatus.item]) {
        stream.write(`>p${playerNumber} move ${choice} zmove`)
    }
    else {
        stream.write(`>p${playerNumber} move ${choice}`)
    }
}

function playerMoveChoicesDoubles(stream, playerNumber, sideStatus) {
    const pokemon1 = sideStatus.active[0]
    const pokemon2 = sideStatus.active[1]
    if (sideStatus.pokemonLeft == 2) {
        stream.write(`>p${playerNumber} ${getMoveChoiceStringDoubles(pokemon1)}, ${getMoveChoiceStringDoubles(pokemon2)}`)
    }
    else if (pokemon1.hp > 0){
        stream.write(`>p${playerNumber} ${getMoveChoiceStringDoubles(pokemon1)}`)
    }
    else if (pokemon2.hp > 0){
        stream.write(`>p${playerNumber} ${getMoveChoiceStringDoubles(pokemon2)}`)
    }
}

function getMoveChoiceStringDoubles(pokemonStatus) {
    const choice = getMoveChoice(pokemonStatus)
    let choiceString = "move " + choice

    if (canChooseMove(pokemonStatus)) {
        if (pokemonStatus.moveSlots[choice - 1].target == 'normal' || (pokemonStatus.moveSlots[choice - 1].target == 'any' && (Dex.moves.get(pokemonStatus.moveSlots[choice - 1].move).category == 'Physical' || Dex.moves.get(pokemonStatus.moveSlots[choice - 1].move).category == 'Special'))) {
            choiceString += " " + (Math.floor(Math.random() * 2) + 1)
        }
        else if (pokemonStatus.moveSlots[choice - 1].target == 'any') {
            choiceString += " " + (Math.floor(Math.random() * 3) + 1)
        }
    }

    if (typeof(pokemonStatus.canMegaEvo) == 'string' && Math.random() < 0.5) {
        choiceString += " mega"
    }
    else if (Math.random() < 0.5 && Dex.moves.get(pokemonStatus.moveSlots[choice - 1].move).type == zCristalType[pokemonStatus.item]) {
        choiceString += " zmove"
    }

    return choiceString
}

function getMoveChoice(pokemonStatus) {
    if (canChooseMove(pokemonStatus)) {
        const availableMoves = []
        for (let move in pokemonStatus.moveSlots) {
            if (!pokemonStatus.moveSlots[move].disabled) {
                availableMoves.push(move)
            }
        }
        return Number(availableMoves[Math.floor(Math.random() * availableMoves.length)]) + 1
    }
    else {
        return 1
    }
}

function canChooseMove(pokemonStatus) {
    return !(Object.keys(pokemonStatus.volatiles).includes('mustrecharge') || Object.keys(pokemonStatus.volatiles).includes('twoturnmove'))
}

function readSets(sources) {
    const sets = [] 
    for (let source of sources) {
        try {
            sets.push(fs.readFileSync(source).toString())
        } catch (exception) {
            if (exception.code == 'ENOENT') {
                console.log("ENOENT: File at", source, "does not exist")
            }
            else {
                console.log("Reading of", source, "failed:", exception.code)
            }
        }
    }
    return sets
}

function mergeSets(sets) {
    let team = ""
    for (let set of sets) {
        team += set
        if (team.slice(team.length - 2) != "\n\n") {
            team += "\n\n"
        }
    }
    return team
}

function pathsTo(setNames) {
    const paths = []
    for (name of setNames) {
        paths.push(setDir + name + ".txt")
    }
    return paths
}

const zCristalType = {
    "buginiumz": "Bug",
    "darkiniumz": "Dark",
    "dragoniumz": "Dragon",
    "electriumz": "Electric",
    "fairiumz": "Fairy",
    "fightiniumz": "Fighting",
    "firiumz": "Fire",
    "flyiniumz": "Flying",
    "ghostiumz": "Ghost",
    "grassiumz": "Grass",
    "groundiumz": "Ground",
    "iciumz": "Ice",
    "normaliumz": "Normal",
    "poisoniumz": "Poison",
    "psychiumz": "Psychic",
    "rockiumz": "Rock",
    "steeliumz": "Steel",
    "wateriumz": "Water"
}

exp.listen(3000, () => console.log("🚀 server is running at http://localhost:3000"))
require('open').default("http://localhost:3000/Pokemon-leagueCreator.html")