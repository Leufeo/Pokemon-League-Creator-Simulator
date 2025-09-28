# Pokemon-League Creator & Simulator
a fun project by Leon Broda

web application and express server for random battle simulation based on pokemon-showdown

Run by starting simulationServer.js with nodejs. Web application will open automatically. The node packages "express", "pokemon-showdown" and "open" (to open web site automatically) are required. Install them if you haven't already by executing `npm install -g package_name` in command line.

This project evolved from a silly fun project I started. It contains the random generation of pokemon, putting them together in leagues with relegation and fighting the pairings out by letting them choose one of their four moves randomly every round until one forfainted. I admit it's very random but for me that's the fun about it. While doing everything manually I became the idea for this application. My basic idea was to create a league creator specifically designed for Pokemon that provides automatic generation of matchdays and a table that is updated for every change that is made. After designing it I used it continue with my first mentioned small hobby project and became the idea that it would be nice to simulate pairings with just one click in the web application. I achieved that by setting up an express server that runs a nodejs script which uses the battle simulator of pokemon showdown to simulate battles randomly. For now it only features one versus one pokemon battles but I plan to add two versus two. Mega evolutions and Z moves are if possible triggered by a 50% chance. Dynamax and terrastalization aren't used.

Insert custom sets as text files in the folder name pokemonSets. It is important that file names equal the Pokemons nickname. For example `nickname.txt`. Leagues are saved in JSON format.
