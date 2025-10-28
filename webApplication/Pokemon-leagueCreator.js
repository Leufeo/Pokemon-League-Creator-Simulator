let participants = []
let isDrawEnabled = false

let main = document.querySelector('main')

const table = component.create('div', {}, "", [
    component.create('h2', {}, "Table", []),
    component.create('table', {}, "", [
        component.create('tr', {}, "", [
            component.create('th', {}, "", []),
            component.create('th', {}, "Pokemon", []),
            component.create('th', {}, "Left HP", []),
            component.create('th', {}, "Wins", [])
        ]),
    ])
])
main.appendChild(render(table))
const input = document.createElement('input')
input.addEventListener('keypress', function(event) {
    if (event.key == "Enter") {
        newParticipant()
    }
})
main.appendChild(input)
main.appendChild(render(component.create('button', {}, "Add", []).addEventListener('click', newParticipant)))
main.appendChild(render(component.create('button', {}, "Confirm lineup", []).addEventListener('click', generateSchedule)))
main.appendChild(render(component.create('input', {'type': "file"}, "", []).addEventListener('change', load)))

function newParticipant() {
    participants.push({"name": input.value, "wins": 0, "draws": 0, "HP": 0})
    table.children[1].children.push(component.create('tr', {}, "", [
        component.create('th', {}, table.children[1].children.length + ".", []),
        component.create('th', {}, input.value, []),
        component.create('th', {}, "0%", []),
        component.create('th', {}, 0, [])
    ]))
    input.value = ""
    table.children[1].domRef.appendChild(render(table.children[1].children[table.children[1].children.length - 1]))
}

const schedule = component.create('div', {}, "", [])

function generateSchedule() {
    const participantCount = table.children[1].children.length - 1

    if (participantCount % 2 == 0) {
        const participantsRandomOrder = participants.sort(function() {return 0.5 - Math.random()})

        schedule.children.push(
            component.create('h2', {}, "Schedule ", [
                component.create('input', {'value': "League 1 S1"}, "", []).addEventListener('keypress', function(event) {
                    if (event.key == "Enter") {
                        confirmName()
                    }
                }),
                component.create('button', {}, "Confirm", []).addEventListener('click', confirmName)
            ]),
            component.create('table', {'id': "schedule"}, "", []),
        )

        // runs algorithms that determines pairings
        let group1 = []
        for (let i = 1; i < participantCount / 2; i++) {
            group1.push(i)
        }

        let group2 = []
        for (let i = participantCount - 1; i > participantCount / 2; i--) {
            group2.push(i)
        }

        let joker = [participantCount / 2, participantCount]
        for (let i = 0; i < participantCount - 1; i++) {
            schedule.children[1].children.push(component.create('div', {'class': "matchday"}, "", []))
            for (let j = 0; j < participantCount / 2 - 1; j++) {
                if (Math.random() < 0.5) {
                    createPairing(participantsRandomOrder[group1[j] - 1]["name"], participantsRandomOrder[group2[j] - 1]["name"])
                }
                else {
                    createPairing(participantsRandomOrder[group2[j] - 1]["name"], participantsRandomOrder[group1[j] - 1]["name"])
                }
            }
            if (Math.random() < 0.5) {
                createPairing(participantsRandomOrder[joker[0] - 1]["name"], participantsRandomOrder[joker[1] - 1]["name"])
            }
            else {
                createPairing(participantsRandomOrder[joker[1] - 1]["name"], participantsRandomOrder[joker[0] - 1]["name"])
            }

            schedule.children[1].children[i].children.sort(function() {return 0.5 - Math.random()})

            if (i % 2 == 0) {
                group1.push(joker[0])
                joker[0] = group1[0]
                group1 = group1.slice(1)
            }

            if (i % 2 == 1) {
                group2 = [joker[0]].concat(group2)
                joker[0] = group2[group2.length - 1]
                group2 = group2.slice(0, -1)
            }
        }

        schedule.children[1].children.sort(function() {return 0.5 - Math.random()})

        schedule.children[1].children[0].children[0].children.push(component.create('button', {}, "Simulate", []).addEventListener('click', simulateBattle))

        for (let i = 0; i < participantCount - 1; i++) {
            schedule.children[1].children[i].children = [component.create('h3', {}, "Matchday " + (i + 1), [
                component.create('input', {'type': "checkbox", 'checked': undefined}, "", []).addEventListener('click', toggleMatchdays)
            ])].concat(schedule.children[1].children[i].children)
        }

        renderSchedule()
    }
}

function renderSchedule() {
    schedule.children.push(
        component.create('button', {}, "Save", []).addEventListener('click', save),
        component.create('input', {'type': "file"}, "", []).addEventListener('change', load)
    )

    table.children.push(
        component.create('div', {}, "", [
            component.create('button', {}, "colourSettings", []).addEventListener('click', colourSettings)
        ])
    )
    if (table.children.length > 3) {
        table.children.splice(3)
    }

    main.parentElement.appendChild(render(component.create('main', {'id': "main"}, "", [schedule, table])))
    main.remove()
    main = document.querySelector('main')
}

function createPairing(name1, name2, didLeftWin = false, didRightWin = false, hp = 0) {
    const lastMatchday = schedule.children[1].children[schedule.children[1].children.length - 1]

    lastMatchday.children.push(component.create('tr', {}, "", [
        component.create('input', {'type': "checkbox", 'class': "left"}, "", []).addEventListener('click', function(event){changeTable(event.currentTarget.parentNode)}),
        component.create('th', {}, name1, []),
        component.create('th', {}, "-", []),
        component.create('th', {}, name2, []),
        component.create('input', {'type': "checkbox", 'class': "right"}, "", []).addEventListener('click', function(event){changeTable(event.currentTarget.parentNode)}),
        component.create('input', {'type': "number", 'size': 3, 'value': hp}, "", []).addEventListener('input', changeTableHP),
        component.create('span', {}, "% ", []),
    ]))

    if (didLeftWin && didRightWin) {
        lastMatchday.children[lastMatchday.children.length - 1].children[0].props['checked'] = undefined
        const i1 = findParticipant(name1)
        participants[i1]["draws"]++

        lastMatchday.children[lastMatchday.children.length - 1].children[4].props['checked'] = undefined
        const i2 = findParticipant(name2)
        participants[i2]["draws"]++
    }
    else if (didLeftWin) {
        lastMatchday.children[lastMatchday.children.length - 1].children[0].props['checked'] = undefined
        const i = findParticipant(name1)
        participants[i]["wins"]++
        participants[i]["HP"] += Number(hp)
    }
    else if (didRightWin) {
        lastMatchday.children[lastMatchday.children.length - 1].children[4].props['checked'] = undefined
        const i = findParticipant(name2)
        participants[i]["wins"]++
        participants[i]["HP"] += Number(hp)
    }
}

function toggleMatchdays(event) {
    const chosenMatchday = event.currentTarget.parentNode.textContent[event.currentTarget.parentNode.textContent.length - 1]
    if (schedule.children[1].children[chosenMatchday - 1].children[0].children[0].domRef.checked) {
        for (let i = 0; i < chosenMatchday - 1; i++) {
            schedule.children[1].children[i].children[0].children[0].domRef.checked = true
        }
    }
    else {
        for (let i = chosenMatchday; i < schedule.children[1].children.length; i++) {
            schedule.children[1].children[i].children[0].children[0].domRef.checked = false
        }
    }

    for (let t of participants) {
        t["wins"] = wins(t["name"])
        t["draws"] = draws(t["name"])
        t["HP"] = sumLeftHP(t["name"])
    }
    refreshTable()
}

function changeTable(rowMatchSchedule) {
    if (rowMatchSchedule.children[0].checked && rowMatchSchedule.children[4].checked) {
        isDrawEnabled = true
    }

    const i1 = findParticipant(rowMatchSchedule.children[1].textContent)
    participants[i1]["wins"] = wins(participants[i1]["name"])
    participants[i1]["draws"] = draws(participants[i1]["name"])
    participants[i1]["HP"] = sumLeftHP(participants[i1]["name"])

    const i2 = findParticipant(rowMatchSchedule.children[3].textContent)
    participants[i2]["wins"] = wins(participants[i2]["name"])
    participants[i2]["draws"] = draws(participants[i2]["name"])
    participants[i2]["HP"] = sumLeftHP(participants[i2]["name"])

    refreshTable()
}

function changeTableHP(event) {
    if (event.currentTarget.parentNode.children[0].checked) {
        let currentParticipant = event.currentTarget.parentNode.children[1].textContent
        participants[findParticipant(currentParticipant)]["HP"] = sumLeftHP(currentParticipant)
    }
    if (event.currentTarget.parentNode.children[4].checked) {
        let currentParticipant = event.currentTarget.parentNode.children[3].textContent
        participants[findParticipant(currentParticipant)]["HP"] = sumLeftHP(currentParticipant)
    }

    refreshTable()
}

function findParticipant(name) {
    for (let i = 0; i < participants.length; i++) {
        if (participants[i]["name"] == name) {
            return i
        }
    }
}

function wins(name) {
    let count = 0
    for (let i = 0; i < schedule.children[1].children.length && schedule.children[1].children[i].children[0].children[0].domRef.checked; i++) {
        let currentMatchday = schedule.children[1].children[i]
        for (let j = 1; j < currentMatchday.children.length; j++) {
            if (currentMatchday.children[j].children[0].domRef.checked != currentMatchday.children[j].children[4].domRef.checked) {
                if (currentMatchday.children[j].children[1].text == name && currentMatchday.children[j].children[0].domRef.checked) {
                    count++
                }
                if (currentMatchday.children[j].children[3].text == name && currentMatchday.children[j].children[4].domRef.checked) {
                    count++
                }
            }
        }
    }
    return count
}

function draws(name) {
    let count = 0
    for (let i = 0; i < schedule.children[1].children.length && schedule.children[1].children[i].children[0].children[0].domRef.checked; i++) {
        let currentMatchday = schedule.children[1].children[i]
        for (let j = 1; j < currentMatchday.children.length; j++) {
            if (currentMatchday.children[j].children[0].domRef.checked && currentMatchday.children[j].children[4].domRef.checked) {
                if (currentMatchday.children[j].children[1].text == name || currentMatchday.children[j].children[3].text == name) {
                    count++
                }
            }
        }
    }
    return count
}

function sumLeftHP(name) {
    let sum = 0
    for (let i = 0; i < schedule.children[1].children.length && schedule.children[1].children[i].children[0].children[0].domRef.checked; i++) {
        let currentMatchday = schedule.children[1].children[i]
        for (let j = 1; j < currentMatchday.children.length; j++) {
            if (currentMatchday.children[j].children[0].domRef.checked != currentMatchday.children[j].children[4].domRef.checked) {
                if (currentMatchday.children[j].children[1].text == name && currentMatchday.children[j].children[0].domRef.checked) {
                    sum += Number(currentMatchday.children[j].children[5].domRef.value)
                }
                if (currentMatchday.children[j].children[3].text == name && currentMatchday.children[j].children[4].domRef.checked) {
                    sum += Number(currentMatchday.children[j].children[5].domRef.value)
                }
            }
        }
    }
    return sum
}

function sortParticipants() {
    participants.sort(compareParticipants)
}

function compareParticipants(a, b) {
    if (a["wins"] != b["wins"]) {
        return b["wins"] - a["wins"]
    }
    if (a["draws"] != b["draws"]) {
        return b["draws"] - a["draws"]
    }
    if (a["HP"] != b["HP"]) {
        return b["HP"] - a["HP"]
    }
    return 0
}

function refreshTable() {
    sortParticipants()
    table.children[1].children = [table.children[1].children[0]]
    for (let i = 0; i < participants.length; i++) {
        if (isDrawEnabled) {
            table.children[1].children[0].children = [
                component.create('th', {}, "", []),
                component.create('th', {}, "Pokemon", []),
                component.create('th', {}, "Left HP", []),
                component.create('th', {}, "Draws", []),
                component.create('th', {}, "Wins", [])
            ]

            table.children[1].children.push(component.create('tr', {}, "", [
                component.create('th', {}, i + 1 + ".", []),
                component.create('th', {}, participants[i]["name"], []),
                component.create('th', {}, participants[i]["HP"] + "%", []),
                component.create('th', {}, participants[i]["draws"], []),
                component.create('th', {}, participants[i]["wins"], [])
            ]))
        }
        else {
            table.children[1].children[0].children = [
                component.create('th', {}, "", []),
                component.create('th', {}, "Pokemon", []),
                component.create('th', {}, "Left HP", []),
                component.create('th', {}, "Wins", [])
            ]

            table.children[1].children.push(component.create('tr', {}, "", [
                component.create('th', {}, i + 1 + ".", []),
                component.create('th', {}, participants[i]["name"], []),
                component.create('th', {}, participants[i]["HP"] + "%", []),
                component.create('th', {}, participants[i]["wins"], [])
            ]))
        }
    }
    colourTable()
}

function save() {
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(saveJson()));
    link.setAttribute('download', name + ".json");
    link.click()
}

function saveJson() {
    const json = {"schedule": [], "draws": false, "simulated": countBattlesSimulated, "colourSettings": {"winner": winner, "relegatedUp": relegatedUp, "relegatedDown": relegatedDown, "relegatedDown2": relegatedDown2}}

    if (schedule.children[0].children[0].type == 'button') {
        json["name"] = name
    }    

    for (let i = 0; i < schedule.children[1].children.length; i++) {
        json["schedule"].push([])
        let currentMatchday = schedule.children[1].children[i]
        for (let j = 1; j < currentMatchday.children.length; j++) {
            json["schedule"][i].push({"id": i + 1 + "." + j, "left": currentMatchday.children[j].children[1].domRef.textContent, "right": currentMatchday.children[j].children[3].domRef.textContent, "win": [currentMatchday.children[j].children[0].domRef.checked, currentMatchday.children[j].children[4].domRef.checked], "HP": currentMatchday.children[j].children[5].domRef.value})
            if (json["schedule"][i][j - 1]["win"][0] && json["schedule"][i][j - 1]["win"][1]) {
                json["schedule"][i][j - 1]["HP"] = 0
            }
        }
    }

    for (let t of participants) {
        if (t["draws"] > 0) {
            json["draws"] = true
            break
        }
    }

    console.log(json)
    return JSON.stringify(json)
}

function load(event) {
    const jsonReader = new FileReader()
    jsonReader.addEventListener('load', function() {
        const data = JSON.parse(jsonReader.result) 
        console.log(data)

        participants = []
        for (let battle of data["schedule"][0]) {
            participants.push({"name": battle["left"], "wins": 0, "draws": 0, "HP": 0}, {"name": battle["right"], "wins": 0, "draws": 0, "HP": 0})
        }

        schedule.children = [
            component.create('h2', {}, "Schedule ", [
                component.create('input', {'value': "Liga 1 S1"}, "", []).addEventListener('keypress', function(event) {
                    if (event.key == "Enter") {
                        confirmName()
                    }
                }),
                component.create('button', {}, "Confirm", []).addEventListener('click', confirmName)
            ]),
            component.create('table', {'id': "schedule"}, "", []),
        ]
        for (let matchday of data["schedule"]) {
            schedule.children[1].children.push(component.create('div', {'class': "matchday"}, "", [
                component.create('h3', {}, "Matchday " + matchday[0]["id"].split(".")[0], [
                    component.create('input', {'type': "checkbox", 'checked': undefined}, "", []).addEventListener('click', toggleMatchdays)
                ])
            ]))
            for (let battle of matchday) {
                createPairing(battle["left"], battle["right"], battle["win"][0], battle["win"][1], battle["HP"])
            }
        }

        if (data["name"] != undefined) {
            schedule.children[0].children[0].props['value'] = data["name"]
        }

        isDrawEnabled = data["draws"]

        countBattlesSimulated = data["simulated"]
        if (countBattlesSimulated != undefined && countBattlesSimulated / (schedule.children[1].children[0].children.length - 1) < data["schedule"].length) {
            schedule.children[1].children[Math.floor(countBattlesSimulated / (schedule.children[1].children[0].children.length - 1))].children[countBattlesSimulated % (schedule.children[1].children[0].children.length - 1) + 1].children.push(component.create('button', {}, "Simulate", []).addEventListener('click', simulateBattle))
        }

        refreshTable()
        renderSchedule()

        if (data["name"] != undefined) {
            confirmName()
        }

        winner = data["colourSettings"]["winner"]
        relegatedUp = data["colourSettings"]["relegatedUp"]
        relegatedDown = data["colourSettings"]["relegatedDown"]
        relegatedDown2 = data["colourSettings"]["relegatedDown2"]
        colourTable()
    })

    jsonReader.readAsText(event.target.files[0])
}

let name = ""
function confirmName() {
    name = schedule.children[0].children[0].domRef.value
    schedule.children[0].text += name + " "
    schedule.children[0].children = [component.create('button', {}, "Bearbeiten", []).addEventListener('click', changeName)]
    rerender(schedule.children[0], schedule.domRef, schedule.children[0].domRef)
}

function changeName() {
    schedule.children[0].children = [
        component.create('input', {'value': schedule.children[0].text.slice(schedule.children[0].text.indexOf(" ") + 1, -1)}, "", []).addEventListener('keypress', function(event) {
            if (event.key == "Enter") {
                confirmName()
            }
        }),
        component.create('button', {}, "Confirm", []).addEventListener('click', confirmName)
    ]
    schedule.children[0].text = "schedule "
    rerender(schedule.children[0], schedule.domRef, schedule.children[0].domRef)
}

let winner = false
let relegatedUp = 0
let relegatedDown = 0
let relegatedDown2 = 0
function colourSettings() {
    if (table.children[2].children.length == 1) {
        table.children[2].children.push(
            component.create('p', {}, "winner ", [
                component.create('input', {'type': "checkbox"}, "", []).addEventListener('input', function() {
                    winner = table.children[2].children[1].children[0].domRef.checked
                    colourTable()
                })
            ]),
            component.create('p', {}, "relegated up ", [
                component.create('input', {'type': "number", 'size': 1, 'value': relegatedUp}, "", []).addEventListener('input', function() {
                    relegatedUp = table.children[2].children[2].children[0].domRef.value
                    colourTable()
                })
            ]),
            component.create('p', {}, "relegated down ", [
                component.create('input', {'type': "number", 'size': 1, 'value': relegatedDown}, "", []).addEventListener('input', function() {
                    relegatedDown = table.children[2].children[3].children[0].domRef.value
                    colourTable()
                })
            ]),
            component.create('p', {}, "relegated down 2 ", [
                component.create('input', {'type': "number", 'size': 1, 'value': relegatedDown2}, "", []).addEventListener('input', function() {
                    relegatedDown2 = table.children[2].children[4].children[0].domRef.value
                    colourTable()
                })
            ])
        )
        if (winner) {
            table.children[2].children[1].children[0].props['checked'] = undefined
        }
    }
    else {
        table.children[2].children.splice(1)
    }
    rerender(table.children[2], table.domRef, table.children[2].domRef)
}

function colourTable() {
    let i = 0

    if (winner) {
        table.children[1].children[1].props['id'] = "champion"
        i++
    }
    else {
        table.children[1].children[1].props['id'] = undefined
    }

    for (let j = i + 1; j < table.children[1].children.length; j++) {
        table.children[1].children[j].props['class'] = undefined
    }

    for (; i < relegatedUp; i++) {
        table.children[1].children[i + 1].props['class'] = "relegationUp"
    }

    if (table.children[1].children.length - relegatedDown - relegatedDown2 > relegatedUp) {
        for (i = table.children[1].children.length - relegatedDown - relegatedDown2; i < table.children[1].children.length - relegatedDown; i++) {
            table.children[1].children[i].props['class'] = "relegationDown2"
        }
    }

    if (table.children[1].children.length - relegatedDown > relegatedUp) {
        for (i = table.children[1].children.length - relegatedDown; i < table.children[1].children.length; i++) {
            table.children[1].children[i].props['class'] = "relegationDown"
        }
    }
    
    rerender(table.children[1], table.domRef, table.children[1].domRef)
}

let countBattlesSimulated = 0
async function simulateBattle(event) {
    const row = event.currentTarget.parentNode
    const results = await fetch("http://localhost:3000/sim/1v1", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "left": row.children[1].textContent, 
            "right": row.children[3].textContent
        })
    })
    const battle = await results.json()
    const report = JSON.parse(battle[battle.length - 1].slice(4))
    console.log(battle)

    const winner = winnerName(report, row)
    if (row.children[1].textContent == winner) {
        row.children[0].checked = true
        row.children[4].checked = false

    }
    if (row.children[3].textContent == winner) {
        row.children[0].checked = false
        row.children[4].checked = true
    }
    
    row.children[5].value = leftHP(winner, battle)

    row.children[7].remove()
    changeTable(row)

    countBattlesSimulated++
    if (countBattlesSimulated < schedule.children[1].children.length * (schedule.children[1].children[0].children.length - 1)) {
        schedule.children[1].children[Math.floor(countBattlesSimulated / (schedule.children[1].children[0].children.length - 1))].children[countBattlesSimulated % (schedule.children[1].children[0].children.length - 1) + 1].domRef.appendChild(render(component.create('button', {}, "Simulate", []).addEventListener('click', simulateBattle)))
    }
}

function winnerName(report, rowMatchSchedule) {
    if (report["winner"] == "left") {
        return rowMatchSchedule.children[1].textContent
    }
    if (report["winner"] == "right") {
        return rowMatchSchedule.children[3].textContent
    } 
}

function leftHP(name, battle) {
    let i = battle.length - 2
    while (!(wasAttacked(battle[i], name) || wasHealed(battle[i], name)) && i > 0) {
        i--
    }
    console.log("i", i)
    if (i == 0) {
        return 100
    }
    if (battle[i].lastIndexOf("-damage") > battle[i].lastIndexOf("-heal")) {
        return numberStartingAt(battle[i], battle[i].lastIndexOf("-damage") + 14 + name.length)
    }
    return numberStartingAt(battle[i], battle[i].lastIndexOf("-heal") + 12 + name.length)
}

function wasAttacked(str, name) {
    return str.lastIndexOf("-damage") > -1 && str.indexOf(name, str.indexOf("-damage") + 7) > -1 && str.indexOf(name, str.lastIndexOf("-damage") + 7) < str.indexOf("100", str.lastIndexOf("-damage") + 7)
}

function wasHealed(str, name) {
    return str.lastIndexOf("-heal") > -1 && str.indexOf(name, str.indexOf("-heal") + 5) > -1 && str.indexOf(name, str.lastIndexOf("-heal") + 5) < str.indexOf("100", str.lastIndexOf("-heal") + 5)
}

function numberStartingAt(string, i) {
    let digits = 0
    // console.log("["+string.charAt(i)+"]")
    while (string.charCodeAt(i + digits) > 47 && string.charCodeAt(i + digits) < 58) {
        digits++
    }
    // console.log(digits + ":", string.slice(i, i + digits))
    return string.slice(i, i + digits)
}