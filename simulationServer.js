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

    let properties = undefined
    try {
        properties = addPlayers(stream, ["left", "right"], [[setDir + request["body"]["left"] + ".txt"], [setDir + request["body"]["right"] + ".txt"]])
        for (let player in properties) {
            if (Object.keys(properties[player]).length == 0) {
                console.log("No sets found for player " + player)
                throw new Error("No sets found for player " + player)
            }
        }
    } catch {
        console.log("1v1: Player initialization failed")
        stream._destroy()
        return
    }

    stream.write(">p1 team 1")
    stream.write(">p2 team 1")

    for (let i = 0;  i < 200;  i++) {
        moveChoiceSingles(stream, 1, properties["left"][Object.keys(properties["left"])[0]])
        moveChoiceSingles(stream, 2, properties["right"][Object.keys(properties["right"])[0]])
    }
})

exp.post("/sim/2v2", function (request, result) {
    const stream = new Sim.BattleStream()
    readStream(stream, result);

    stream.write(`>start {"formatid":"[Gen 9] Doubles Custom Game"}`)

    let properties = undefined
    try {
        properties = addPlayers(stream, ["left", "right"], [pathsTo(request["body"]["left"]), pathsTo(request["body"]["right"])])
        for (let player in properties) {
            if (Object.keys(properties[player]).length == 0) {
                console.log("No sets found for player " + player)
                throw new Error("No sets found for player " + player)
            }
        }
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
        playerMoveChoicesDoubles(stream, 1, properties["left"])
        playerMoveChoicesDoubles(stream, 2, properties["right"])
    }
})

async function readStream(stream, resultVariable) {
    const battle = []
    for await (const output of stream) {
        battle.push(output)
        console.log(output)
    }
    resultVariable.send(battle)
}

function addPlayers(stream, names, sources) {
    const properties = {}
    let i = 1
    for (let name of names) {
        properties[name] = addPlayer(stream, i, name, sources[i - 1])
        i += 1
    }
    return properties
}

function addPlayer(stream, number, name, sources) {
    const sets = readSets(sources)
    if (sets.length > 0) {
        stream.write(`>player p${number} ${JSON.stringify({"name": name, "team": Teams.pack(Teams.import(mergeSets(sets)))})}`)
    }
    
    const properties = {}
    for (let set of sets) {
        p = getProperties(set)
        properties[p["title"]] = p
        delete properties[p["title"]]["title"]
    }
    return properties
}

function moveChoiceSingles(stream, playerNumber, setProperties) {
    const choice = Math.floor(Math.random() * setProperties["moves"].length) + 1
    if (setProperties["mega"] && Math.random() < 0.5) {
        stream.write(`>p${playerNumber} move ${choice} mega`)
        setProperties["mega"] = false
    }
    else if (setProperties["z"] && Math.random() < 0.5 && setProperties["moves"][choice - 1].type == zCristalType[setProperties["item"]]) {
        stream.write(`>p${playerNumber} move ${choice} zmove`)
        setProperties["z"] = false
    }
    else {
        stream.write(`>p${playerNumber} move ${choice}`)
    }

}

function playerMoveChoicesDoubles(stream, playerNumber, sideProperties) {
    const pokemon1 = stream.battle.sides[playerNumber - 1].active[0]
    const pokemon2 = stream.battle.sides[playerNumber - 1].active[1]
    if (stream.battle.sides[playerNumber - 1].pokemonLeft == 2) {
        stream.write(`>p${playerNumber} ${getMoveChoiceStringDoubles(sideProperties[pokemon1.name], pokemon1)}, ${getMoveChoiceStringDoubles(sideProperties[pokemon2.name], pokemon2)}`)
    }
    else if (stream.battle.sides[playerNumber - 1].active[0].hp > 0){
        stream.write(`>p${playerNumber} ${getMoveChoiceStringDoubles(sideProperties[pokemon1.name], pokemon1)}`)
    }
    else if (stream.battle.sides[playerNumber - 1].active[1].hp > 0){
        stream.write(`>p${playerNumber} ${getMoveChoiceStringDoubles(sideProperties[pokemon2.name], pokemon2)}`)
    }
}

function getMoveChoiceStringDoubles(setProperties, pokemonStatus) {
    const choice = Math.floor(Math.random() * setProperties["moves"].length) + 1
    let choiceString = "move " + choice
    if (!(Object.keys(pokemonStatus.volatiles).includes('mustrecharge') || Object.keys(pokemonStatus.volatiles).includes('twoturnmove'))) { // compatibility with special cases like pokemon shapeshifting needs to be tested
        if (setProperties["moves"][choice - 1].target == 'normal' || (setProperties["moves"][choice - 1].target == 'any' && (Dex.moves.get(pokemonStatus.moveSlots[choice - 1].move).category == 'Physical' || Dex.moves.get(pokemonStatus.moveSlots[choice - 1].move).category == 'Special'))) {
            choiceString += " " + (Math.floor(Math.random() * 2) + 1)
        }
        else if (setProperties["moves"][choice - 1].target == 'any') {
            choiceString += " " + (Math.floor(Math.random() * 3) + 1)
        }
    }

    if (setProperties["mega"] && Math.random() < 0.5) {
        choiceString += " mega"
        setProperties["mega"] = false
    }
    else if (setProperties["z"] && Math.random() < 0.5 && setProperties["moves"][choice - 1].type == zCristalType[setProperties["item"]]) {
        choiceString += " zmove"
        setProperties["z"] = false
    }

    return choiceString
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

function getProperties(set) {
    const properties = {}

    properties["title"] = removeLastSpaces(set.slice(0, set.indexOf("\n") - 1))
    if (properties["title"].indexOf("@") > -1) {
        properties["item"] = properties["title"].slice(properties["title"].indexOf("@") + 2)
    }

    properties["moves"] = []
    for (let i = 1; i <= set.match(new RegExp("\n- ", 'g')).length; i++) {
        properties["moves"].push(getMoveFromSet(set, i))
    }

    properties["mega"] = properties["title"].slice(properties["title"].length - 4).indexOf("te") > -1
    properties["z"] = properties["title"].charAt(properties["title"].length - 1) == "Z"

    if (properties["title"].indexOf(" (") > -1) {
        properties["title"] = properties["title"].slice(0, properties["title"].indexOf(" ("))
    }
    else if (properties["title"].indexOf(" @") > -1) {
        properties["title"] = properties["title"].slice(0, properties["title"].indexOf(" @"))
    }
    else {
        properties["title"] = removeLastSpaces(properties["title"])
    }
    return properties
}

function getMoveFromSet(set, moveNumber) { // reimplementation to use stream attributes recommended
    let i = 0
    for (let j = 0; j < moveNumber; j++) {
        i = set.indexOf("- ", i + 1)
    }
    if (set.indexOf("\n", i) == -1) {
        return Dex.moves.get(set.slice(i + 2))
    }
    return Dex.moves.get(set.slice(i + 2, set.indexOf("\n", i)))
}

function removeLastSpaces(str) {
    let i = 1
    console.log(str.charAt(str.length - i))
    while (str.charAt(str.length - i) == " " || str.charAt(str.length - i) == "\n") {
        i++
    }
    return str.slice(0, str.length - i + 1)
}

function pathsTo(setNames) {
    const paths = []
    for (name of setNames) {
        paths.push(setDir + name + ".txt")
    }
    return paths
}

const zCristalType = {
    "Buginium Z": "Bug",
    "Darkinium Z": "Dark",
    "Dragonium Z": "Dragon",
    "Electrium Z": "Electric",
    "Fairium Z": "Fairy",
    "Fightinium Z": "Fighting",
    "Firium Z": "Fire",
    "Flyinium Z": "Flying",
    "Ghostium Z": "Ghost",
    "Grassium Z": "Grass",
    "Groundium Z": "Ground",
    "Icium Z": "Ice",
    "Normalium Z": "Normal",
    "Poisonium Z": "Poison",
    "Psychium Z": "Psychic",
    "Rockium Z": "Rock",
    "Steelium Z": "Steel",
    "Waterium Z": "Water"
}

exp.listen(3000, () => console.log("🚀 server is running at http://localhost:3000"))
require('open').default("http://localhost:3000/Pokemon-leagueCreator.html")