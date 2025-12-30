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

    let properties = {}
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

    for (let i = 0;  i < 200;  i++) {
        moveChoice(stream, 1, properties["left"][Object.keys(properties["left"])[0]])
        moveChoice(stream, 2, properties["right"][Object.keys(properties["right"])[0]])
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

function moveChoice(stream, playerNumber, setProperties) {
    const choice = Math.floor(Math.random() * 4) + 1
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
    properties["moves"] = [getMoveFromSet(set, 1), getMoveFromSet(set, 2), getMoveFromSet(set, 3), getMoveFromSet(set, 4)]
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