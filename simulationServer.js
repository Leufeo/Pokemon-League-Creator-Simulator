const express = require('express') 
const cors = require('cors') 

const exp = express() 
exp.use(cors()) 
exp.use(express.json()) 

exp.use(express.static("./webApplication")) 

const Sim = require('pokemon-showdown') 
const {Teams, Dex} = require('pokemon-showdown') 
const fs = require('fs') 
const { title } = require('process')
exp.post("/sim/1v1", function (request, result) {
    const stream = new Sim.BattleStream() 

    const battle = [];
    (async () => {
        for await (const output of stream) {
            battle.push(output)
            console.log(output)
        }
        result.send(battle)
    })() 

    stream.write(`>start {"formatid":"custombattle"}`) 

    function player(number, playerName, teamExport) {
        stream.write(`>player p${number} ${JSON.stringify({name:playerName, team:Teams.pack(Teams.import(teamExport))})}`) 
    }

    const sets = []
    const titles = []
    const mega = []
    const z = []
    function playerFromTxt(number, playerName, source) {
        const set = fs.readFileSync(source).toString()
        player(number, playerName, set) 

        const title = removeLastSpaces(set.slice(0, set.indexOf("\n") - 1))
        titles.push(title)

        sets.push(set)
        mega.push(title.slice(title.length - 4).indexOf("te") > -1)
        z.push(title.charAt(title.length - 1) == "Z")
    }

    playerFromTxt(1, "left", "./pokemonSets/" + request["body"]["left"] + ".txt")
    playerFromTxt(2, "right", "./pokemonSets/" + request["body"]["right"] + ".txt")

    for (let i = 0;  i < 200;  i++) {
        let choice = Math.floor(Math.random() * 4) + 1
        if (mega[0] && Math.random() < 0.5) {
            stream.write(`>p1 move ${choice} mega`)
            mega[0] = false
        }
        else if (z[0] && Math.random() < 0.5 && getMoveFromSet(sets[0], choice).type == zCristalType[titles[0].slice(titles[0].indexOf("@") + 2)]) {
            stream.write(`>p1 move ${choice} zmove`)
            z[0] = false
        }
        else {
            stream.write(`>p1 move ${choice}`)
        }

        choice = Math.floor(Math.random() * 4) + 1
        if (mega[1] && Math.random() < 0.5) {
            stream.write(`>p2 move ${choice} mega`)
            mega[1] = false
        }
        else if (z[1] && Math.random() < 0.5 && getMoveFromSet(sets[1], choice).type == zCristalType[titles[1].slice(titles[0].indexOf("@") + 2)]) {
            stream.write(`>p2 move ${choice} zmove`)
            z[1] = false
        }
        else {
            stream.write(`>p2 move ${choice}`)
        }
    }
})

function getMoveFromSet(set, moveNumber) {
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